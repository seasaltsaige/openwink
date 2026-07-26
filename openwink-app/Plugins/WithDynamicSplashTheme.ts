import {
  ConfigPlugin,
  withAndroidColors,
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
  withMainActivity,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

/**
 * Dynamic splash + adaptive icon per color theme for Android.
 *
 * `@howincodes/expo-dynamic-app-icon` already switches the launcher icon at
 * runtime by toggling `<activity-alias>` entries. The catch: an alias can't
 * carry its own `android:theme`, so a stock setup would always show the same
 * splash regardless of which icon is active.
 *
 * To work around that, this plugin:
 *   1. Marks `MainActivity` as `open` and generates an empty Kotlin subclass
 *      per theme (`MainActivity<Name>Impl`).
 *   2. Adds a splash theme + background color resource per theme.
 *   3. Points `MainActivity` at the default variant's splash (so the first
 *      launch — before any `setAppIcon()` call — matches the default theme).
 *   4. Re-points each dynamic-icon alias at its matching `Impl`, so once the
 *      library swaps the icon, the new alias launches into the right splash.
 *
 * MainActivity stays the default launcher at install time; aliases are kept
 * disabled and only get enabled by `setAppIcon()` (which also disables
 * MainActivity). That keeps the canonical Expo/EAS build flow working —
 * including `npx expo run:android` — with no manual gradle dance.
 *
 * Adding a new theme: append to `variants` and drop the icon PNG into
 * ./assets/.
 */

type Variant = {
  key: string;       // Alias name used by expo-dynamic-app-icon
  name: string;      // PascalCase, used for the Impl class + style names
  color: string;     // Splash background
  iconPath: string;  // Foreground PNG, relative to project root
};

const variants: Variant[] = [
  { key: "white",  name: "White",  color: "#bd9664", iconPath: "./assets/icon_crystal_white_android.png" },
  { key: "black",  name: "Black",  color: "#550000", iconPath: "./assets/icon_burgundy_android.png" },
  { key: "red",    name: "Red",    color: "#c8102e", iconPath: "./assets/icon_classic_red_android.png" },
  { key: "yellow", name: "Yellow", color: "#ffcc00", iconPath: "./assets/icon_sunburst_yellow_android.png" },
  { key: "blue",   name: "Blue",   color: "#0033a0", iconPath: "./assets/icon_marina_blue_android.png" },
  { key: "green",  name: "Green",  color: "#004d26", iconPath: "./assets/icon_british_racing_green_android.png" },
];

const defaultKey = "green";
const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

const implClass    = (v: Variant) => `MainActivity${v.name}Impl`;
const splashTheme  = (v: Variant) => `Theme.App.SplashScreen.${v.name}`;
const bgColorName  = (v: Variant) => `${v.key}_background`;

const adaptiveIconXml = (key: string) => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/${key}_background"/>
    <foreground android:drawable="@drawable/${key}_foreground"/>
</adaptive-icon>
`;

const withOpenMainActivity: ConfigPlugin = (config) =>
  withMainActivity(config, (cfg) => {
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /^class MainActivity/m,
      "open class MainActivity",
    );
    return cfg;
  });

const withImplActivities: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      const pkg = cfg.android!.package!;
      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app/src/main/java",
        ...pkg.split("."),
      );
      fs.mkdirSync(dir, { recursive: true });

      for (const v of variants) {
        const file = path.join(dir, `${implClass(v)}.kt`);
        fs.writeFileSync(file, `package ${pkg}\n\nclass ${implClass(v)} : MainActivity()\n`);
      }
      return cfg;
    },
  ]);

const withAdaptiveIcons: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      const resDir    = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res");
      const anydpiDir = path.join(resDir, "mipmap-anydpi-v26");
      fs.mkdirSync(anydpiDir, { recursive: true });

      for (const v of variants) {
        const xml = adaptiveIconXml(v.key);
        fs.writeFileSync(path.join(anydpiDir, `${v.key}.xml`), xml);
        fs.writeFileSync(path.join(anydpiDir, `${v.key}_round.xml`), xml);

        const iconSrc = path.join(cfg.modRequest.projectRoot, v.iconPath);
        if (!fs.existsSync(iconSrc)) continue;

        for (const density of densities) {
          const target = path.join(resDir, `drawable-${density}`);
          fs.mkdirSync(target, { recursive: true });
          fs.copyFileSync(iconSrc, path.join(target, `${v.key}_foreground.png`));
        }
      }

      // Make the default launcher icon (used by MainActivity) match the default variant.
      const fallback = adaptiveIconXml(defaultKey);
      fs.writeFileSync(path.join(anydpiDir, "ic_launcher.xml"), fallback);
      fs.writeFileSync(path.join(anydpiDir, "ic_launcher_round.xml"), fallback);
      return cfg;
    },
  ]);

const withSplashColors: ConfigPlugin = (config) =>
  withAndroidColors(config, (cfg) => {
    const colors = (cfg.modResults.resources.color ??= []);
    for (const v of variants) {
      const entry = { $: { name: bgColorName(v) }, _: v.color };
      const i = colors.findIndex((c) => c.$.name === entry.$.name);
      if (i >= 0) colors[i] = entry;
      else colors.push(entry);
    }
    return cfg;
  });

const withSplashStyles: ConfigPlugin = (config) =>
  withAndroidStyles(config, (cfg) => {
    const styles = (cfg.modResults.resources.style ??= []);
    for (const v of variants) {
      const entry = {
        $: { name: splashTheme(v), parent: "Theme.SplashScreen" },
        item: [
          { $: { name: "windowSplashScreenBackground" },   _: `@color/${bgColorName(v)}` },
          { $: { name: "windowSplashScreenAnimatedIcon" }, _: `@mipmap/${v.key}` },
          { $: { name: "postSplashScreenTheme" },          _: "@style/AppTheme" },
        ],
      };
      const i = styles.findIndex((s) => s.$.name === entry.$.name);
      if (i >= 0) styles[i] = entry;
      else styles.push(entry);
    }
    return cfg;
  });

// MainActivity stays the launcher (default variant splash); aliases target the
// matching Impl and are disabled until the library enables one at runtime.
const withManifestRewrites: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    const defaultVariant = variants.find((v) => v.key === defaultKey)!;

    const main = app.activity?.find((a) => a.$["android:name"] === ".MainActivity");
    if (main) {
      main.$["android:theme"] = `@style/${splashTheme(defaultVariant)}`;
    }

    app.activity = app.activity ?? [];
    for (const v of variants) {
      const implRef = `.${implClass(v)}`;
      if (app.activity.some((a) => a.$["android:name"] === implRef)) continue;

      app.activity.push({
        $: {
          "android:name": implRef,
          "android:configChanges":
            "keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode",
          "android:launchMode": "singleTask",
          "android:windowSoftInputMode": "adjustResize",
          "android:theme": `@style/${splashTheme(v)}`,
          "android:exported": "false",
          "android:screenOrientation": "portrait",
        },
      } as any);
    }

    for (const alias of app["activity-alias"] ?? []) {
      const match = alias.$["android:name"].match(/MainActivity(\w+)$/);
      if (!match) continue;

      const v = variants.find((x) => x.key === match[1].toLowerCase());
      if (!v) continue;

      alias.$["android:targetActivity"] = `.${implClass(v)}`;
      (alias.$ as any)["android:enabled"] = "false";

      // The library copies deep-link VIEW filters onto every alias; we only
      // want MAIN/LAUNCHER on the aliases.
      if (alias["intent-filter"]) {
        alias["intent-filter"] = alias["intent-filter"].filter(
          (f) => !(f.action ?? []).some(
            (a: any) => a.$["android:name"] === "android.intent.action.VIEW",
          ),
        );
      }
    }
    return cfg;
  });

const withDynamicSplashTheme: ConfigPlugin = (config) => {
  config = withOpenMainActivity(config);
  config = withImplActivities(config);
  config = withSplashColors(config);
  config = withSplashStyles(config);
  config = withAdaptiveIcons(config);
  config = withManifestRewrites(config);
  return config;
};

export default withDynamicSplashTheme;
