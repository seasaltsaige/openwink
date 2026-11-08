import os
import shutil
import struct

DEFAULT_SEGMENTS = [
    (0x0000, "bootloader.bin"),
    (0x8000, "partitions.bin"),
    (0xE000, "ota_data_initial.bin"),
    (0x10000, "firmware.bin"),
]

ESP_APP_DESC_MAGIC = 0xABCD5432
DEFAULT_FLASH_SIZE_BYTES = 4 * 1024 * 1024  # 4MB (0x400000)


def read_version(project_dir: str, firmware_bin: str = "") -> str:
    if firmware_bin and os.path.isfile(firmware_bin):
        try:
            with open(firmware_bin, "rb") as f:
                header = f.read(0x50)
            if len(header) >= 0x50:
                magic = struct.unpack("<I", header[0x20:0x24])[0]
                if magic == ESP_APP_DESC_MAGIC:
                    embedded = (
                        header[0x30:0x50]
                        .split(b"\x00")[0]
                        .decode("ascii", errors="replace")
                        .strip()
                    )
                    if embedded:
                        return embedded.lstrip("v")
        except OSError:
            pass

    version_file = os.path.join(project_dir, "version.txt")
    if os.path.isfile(version_file):
        with open(version_file, "r", encoding="utf-8") as f:
            ver = f.read().strip()
            if ver:
                return ver.lstrip("v")
    return "0.0.0"


def merge_segments_from_build_dir(
    build_dir: str,
    out_path: str,
    segments=None,
    fill_flash_size: int = DEFAULT_FLASH_SIZE_BYTES,
) -> bool:
    if segments is None:
        segments = [
            (offset, os.path.join(build_dir, name))
            for offset, name in DEFAULT_SEGMENTS
        ]

    resolved = []
    for offset, path in segments:
        if isinstance(offset, str):
            offset = int(offset, 0)
        if not os.path.isfile(path):
            print(f"[merge_firmware] Missing binary segment at 0x{offset:X}: {path}")
            return False
        resolved.append((offset, path))

    resolved.sort(key=lambda item: item[0])

    total_len = fill_flash_size
    for offset, path in resolved:
        end = offset + os.path.getsize(path)
        if end > total_len:
            total_len = end

    merged = bytearray(b"\xFF" * total_len)
    for offset, path in resolved:
        with open(path, "rb") as f:
            data = f.read()
        merged[offset : offset + len(data)] = data

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(merged)

    return True


def create_merged_firmware(project_dir: str, build_dir: str, env=None) -> None:
    firmware_bin = os.path.join(build_dir, "firmware.bin")
    factory_bin = os.path.join(build_dir, "firmware.factory.bin")

    version = read_version(project_dir, firmware_bin)
    out_filename = f"openwink-firmware-v{version}.bin"

    build_out_path = os.path.join(build_dir, out_filename)
    pio_root_out_path = os.path.join(project_dir, ".pio", out_filename)

    # Prefer PlatformIO's freshly generated esptool factory image if up to date,
    # padded with 0xFF out to the full 4MB flash size (--fill-flash-size 4MB)
    if (
        os.path.isfile(factory_bin)
        and os.path.isfile(firmware_bin)
        and os.path.getmtime(factory_bin) >= os.path.getmtime(firmware_bin)
    ):
        with open(factory_bin, "rb") as f:
            data = f.read()
        os.makedirs(os.path.dirname(build_out_path), exist_ok=True)
        with open(build_out_path, "wb") as f:
            f.write(data)
            if len(data) < DEFAULT_FLASH_SIZE_BYTES:
                f.write(b"\xFF" * (DEFAULT_FLASH_SIZE_BYTES - len(data)))
        ok = True
    else:
        segments = None
        if env is not None:
            extra_images = env.get("FLASH_EXTRA_IMAGES", [])
            app_offset = env.subst("$ESP32_APP_OFFSET") or "0x10000"
            if extra_images and os.path.isfile(firmware_bin):
                segments = [
                    (img[0], env.subst(img[1])) for img in extra_images
                ] + [(app_offset, firmware_bin)]
        ok = merge_segments_from_build_dir(
            build_dir, build_out_path, segments, DEFAULT_FLASH_SIZE_BYTES
        )

    if ok:
        shutil.copy2(build_out_path, pio_root_out_path)
        size_bytes = os.path.getsize(build_out_path)
        size_mb = size_bytes / (1024.0 * 1024.0)
        print(
            f"[merge_firmware] Generated {out_filename} ({size_mb:.2f} MB / {size_bytes} bytes)\n"
            f"  -> {build_out_path}\n"
            f"  -> {pio_root_out_path}"
        )


try:
    Import("env")  # type: ignore[name-defined]

    def _post_merge_action(source, target, env):
        create_merged_firmware(
            env.subst("$PROJECT_DIR"),
            env.subst("$BUILD_DIR"),
            env=env,
        )

    env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", _post_merge_action)  # type: ignore[name-defined]
except NameError:
    if __name__ == "__main__":
        script_dir = os.path.dirname(os.path.abspath(__file__))
        proj_dir = os.path.dirname(script_dir)
        pio_build_root = os.path.join(proj_dir, ".pio", "build")
        if os.path.isdir(pio_build_root):
            for env_name in sorted(os.listdir(pio_build_root)):
                bdir = os.path.join(pio_build_root, env_name)
                if os.path.isfile(os.path.join(bdir, "firmware.bin")):
                    create_merged_firmware(proj_dir, bdir)
