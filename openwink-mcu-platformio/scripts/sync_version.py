import glob
import os

Import("env")

project_dir = env.subst("$PROJECT_DIR")
build_dir = env.subst("$BUILD_DIR")
version_file = os.path.join(project_dir, "version.txt")
cmake_lists = os.path.join(project_dir, "CMakeLists.txt")
cmake_cache = os.path.join(build_dir, "CMakeCache.txt")
firmware_bin = os.path.join(build_dir, "firmware.bin")

if os.path.isfile(version_file) and os.path.isfile(cmake_lists):
    with open(version_file, "r", encoding="utf-8") as f:
        expected_ver = f.read().strip()

    needs_reconfigure = False

    if os.path.isfile(cmake_cache):
        if os.path.getmtime(version_file) > os.path.getmtime(cmake_cache):
            needs_reconfigure = True
        else:
            reply_pattern = os.path.join(
                build_dir,
                ".cmake",
                "api",
                "v1",
                "reply",
                "target-__idf_esp_app_format-*.json",
            )
            reply_files = glob.glob(reply_pattern)
            expected_define = f'PROJECT_VER=\\"{expected_ver}\\"'
            for rf in reply_files:
                with open(rf, "r", encoding="utf-8") as f:
                    if expected_define not in f.read():
                        needs_reconfigure = True
                        break

    if not needs_reconfigure and os.path.isfile(firmware_bin):
        try:
            with open(firmware_bin, "rb") as f:
                data = f.read(0x50)
            if len(data) >= 0x50:
                embedded = data[0x30:0x50].split(b"\x00")[0].decode("ascii", errors="replace")
                if embedded != expected_ver:
                    needs_reconfigure = True
        except OSError:
            pass

    if needs_reconfigure:
        print(f"[sync_version] Syncing CMake version to {expected_ver}")
        os.utime(cmake_lists, None)
        app_desc_obj = os.path.join(build_dir, "esp-idf", "esp_app_format", "esp_app_desc.c.o")
        if os.path.isfile(app_desc_obj):
            os.remove(app_desc_obj)
