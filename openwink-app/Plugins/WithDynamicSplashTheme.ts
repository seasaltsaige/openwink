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

    const viewFilters = (main?.["intent-filter"] ?? []).filter((f) =>
      (f.action ?? []).some(
        (a: any) => a.$["android:name"] === "android.intent.action.VIEW",
      ),
    );

    for (const alias of (app as any)["activity-alias"] ?? []) {
      const match = alias.$["android:name"].match(/MainActivity(\w+)$/);
      if (!match) continue;

      const v = variants.find((x) => x.key === match[1].toLowerCase());
      if (!v) continue;

      alias.$["android:targetActivity"] = `.${implClass(v)}`;
      (alias.$ as any)["android:enabled"] = "false";

      // Keep deep-link VIEW filters on every alias so QR codes / deep links
      // continue to work after MainActivity is disabled by setAppIcon().
      alias["intent-filter"] = alias["intent-filter"] ?? [];
      const hasViewFilter = alias["intent-filter"].some((f: any) =>
        (f.action ?? []).some(
          (a: any) => a.$["android:name"] === "android.intent.action.VIEW",
        ),
      );
      if (!hasViewFilter && viewFilters.length > 0) {
        alias["intent-filter"].push(...JSON.parse(JSON.stringify(viewFilters)));
      }
    }
    return cfg;
  });

const patchedLifecycleListenerKt = `package expo.modules.dynamicappicon

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener

object SharedObject {
    var packageName: String = ""
    var classesToKill = ArrayList<String>()
    var icon: String = ""
    var pm: PackageManager? = null
    var shouldChangeIcon: Boolean = false
    var isInBackground: Boolean = true
}

class ExpoDynamicAppIconReactActivityLifecycleListener : ReactActivityLifecycleListener {

    private var currentActivity: Activity? = null
    private var isBackground = false
    private var didHealComponents = false
    private val handler = Handler(Looper.getMainLooper())
    private val backgroundCheckRunnable = Runnable {
        if (isBackground) {
            onBackground()
        }
    }

    override fun onPause(activity: Activity) {
        currentActivity = activity
        isBackground = true
        handler.postDelayed(backgroundCheckRunnable, if (SharedObject.isInBackground) 5000 else 0)
    }

    override fun onResume(activity: Activity) {
        currentActivity = activity
        isBackground = false
        handler.removeCallbacks(backgroundCheckRunnable)
        if (!didHealComponents) {
            didHealComponents = true
            healNonLauncherComponents(activity)
        }
    }

    override fun onDestroy(activity: Activity) {
        handler.removeCallbacks(backgroundCheckRunnable)
        if (SharedObject.shouldChangeIcon) {
            applyIconChange(activity)
        }
        if (currentActivity === activity) {
            currentActivity = null
        }
    }

    private fun onBackground() {
        currentActivity?.let { activity ->
            if (SharedObject.shouldChangeIcon) {
                applyIconChange(activity)
            }
        }
    }

    // Only toggle MainActivity and its MainActivity<color> launcher aliases.
    // Never disable MainActivity<Color>Impl target activities or DevMenuActivity.
    private fun isLauncherComponent(name: String, pkg: String): Boolean {
        return name.startsWith("$pkg.MainActivity") && !name.endsWith("Impl")
    }

    private fun healNonLauncherComponents(activity: Activity) {
        try {
            val pkg = activity.packageName
            val pm = activity.packageManager
            val packageInfo = pm.getPackageInfo(
                pkg,
                PackageManager.GET_ACTIVITIES or PackageManager.GET_DISABLED_COMPONENTS
            )
            packageInfo.activities?.forEach { activityInfo ->
                if (!isLauncherComponent(activityInfo.name, pkg)) {
                    val componentName = ComponentName(pkg, activityInfo.name)
                    if (pm.getComponentEnabledSetting(componentName) == PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                        pm.setComponentEnabledSetting(
                            componentName,
                            PackageManager.COMPONENT_ENABLED_STATE_DEFAULT,
                            PackageManager.DONT_KILL_APP
                        )
                        Log.i("IconChange", "Restored non-launcher component: \${activityInfo.name}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("IconChange", "Error healing non-launcher components", e)
        }
    }

    private fun applyIconChange(activity: Activity) {
        SharedObject.icon.takeIf { it.isNotEmpty() }?.let { icon ->
            val pm = SharedObject.pm ?: return
            val pkg = SharedObject.packageName
            val newComponent = ComponentName(pkg, icon)

            if (!doesComponentExist(newComponent)) {
                SharedObject.shouldChangeIcon = false
                return
            }

            try {
                val packageInfo = pm.getPackageInfo(
                    pkg,
                    PackageManager.GET_ACTIVITIES or PackageManager.GET_DISABLED_COMPONENTS
                )

                packageInfo.activities?.forEach { activityInfo ->
                    if (!isLauncherComponent(activityInfo.name, pkg)) {
                        return@forEach
                    }

                    val componentName = ComponentName(pkg, activityInfo.name)
                    val state = pm.getComponentEnabledSetting(componentName)

                    if (activityInfo.name != icon && state != PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                        pm.setComponentEnabledSetting(
                            componentName,
                            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                            PackageManager.DONT_KILL_APP
                        )
                        Log.i("IconChange", "Disabled launcher component: \${activityInfo.name}")
                    }
                }

                pm.setComponentEnabledSetting(
                    newComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Log.i("IconChange", "Enabled new icon: \$icon")
            } catch (e: Exception) {
                Log.e("IconChange", "Error during icon change", e)
            } finally {
                SharedObject.shouldChangeIcon = false
            }

            ensureAtLeastOneComponentEnabled(activity)
        }
    }

    private fun ensureAtLeastOneComponentEnabled(context: Context) {
        val pm = SharedObject.pm ?: return
        val pkg = SharedObject.packageName
        val packageInfo = pm.getPackageInfo(
            pkg,
            PackageManager.GET_ACTIVITIES or PackageManager.GET_DISABLED_COMPONENTS
        )

        val hasEnabledLauncher = packageInfo.activities?.any { activityInfo ->
            isLauncherComponent(activityInfo.name, pkg) &&
                pm.getComponentEnabledSetting(ComponentName(pkg, activityInfo.name)) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } ?: false

        if (!hasEnabledLauncher) {
            val mainActivityName = "\$pkg.MainActivity"
            val mainComponent = ComponentName(pkg, mainActivityName)
            try {
                pm.setComponentEnabledSetting(
                    mainComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Log.i("IconChange", "No active launcher found. Re-enabling \$mainActivityName")
            } catch (e: Exception) {
                Log.e("IconChange", "Error enabling fallback MainActivity", e)
            }
        }
    }

    private fun doesComponentExist(componentName: ComponentName): Boolean {
        return try {
            val packageInfo = SharedObject.pm?.getPackageInfo(
                SharedObject.packageName,
                PackageManager.GET_ACTIVITIES or PackageManager.GET_DISABLED_COMPONENTS
            )
            packageInfo?.activities?.any { it.name == componentName.className } == true
        } catch (e: Exception) {
            false
        }
    }
}
`;

const patchedModuleKt = `package expo.modules.dynamicappicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoDynamicAppIconModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExpoDynamicAppIcon")

    Function("setAppIcon") { name: String?, isInBackground: Boolean? ->
      try {
        val pkg = context.packageName
        SharedObject.packageName = pkg
        SharedObject.pm = pm

        val targetIcon = if (name == null) "$pkg.MainActivity" else "$pkg.MainActivity$name"
        val targetComponent = ComponentName(pkg, targetIcon)
        val targetState = pm.getComponentEnabledSetting(targetComponent)

        // If the requested component is already enabled (or MainActivity is still default-enabled for the default green icon), skip redundant toggling
        val mainComponent = ComponentName(pkg, "$pkg.MainActivity")
        val mainState = pm.getComponentEnabledSetting(mainComponent)
        val isDefaultGreenActive = (name == "${defaultKey}" && (mainState == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT || mainState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED))

        if (targetState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED || isDefaultGreenActive) {
          SharedObject.icon = targetIcon
          SharedObject.shouldChangeIcon = false
          return@Function name ?: "DEFAULT"
        }

        SharedObject.shouldChangeIcon = true
        SharedObject.isInBackground = isInBackground ?: true
        SharedObject.icon = targetIcon

        return@Function name ?: "DEFAULT"
      } catch (e: Exception) {
        return@Function false
      }
    }

    Function("getAppIcon") {
      val componentClass: String = currentActivity.componentName.className
      val currentIcon: String = if (!SharedObject.icon.isEmpty()) SharedObject.icon else componentClass
      val currentIconName: String = currentIcon.split("MainActivity").getOrElse(1) { "" }

      return@Function if (currentIconName.isEmpty() || currentIconName.endsWith("Impl")) "DEFAULT" else currentIconName
    }
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React Application Context is null" }

  private val currentActivity
    get() = requireNotNull(appContext.activityProvider?.currentActivity)

  private val pm
    get() = requireNotNull(currentActivity.packageManager)
}
`;

const withPatchedDynamicAppIcon: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      const moduleDir = path.join(
        cfg.modRequest.projectRoot,
        "node_modules/@howincodes/expo-dynamic-app-icon/android/src/main/java/expo/modules/dynamicappicon",
      );
      if (fs.existsSync(moduleDir)) {
        fs.writeFileSync(
          path.join(moduleDir, "ExpoDynamicAppIconReactActivityLifecycleListener.kt"),
          patchedLifecycleListenerKt,
        );
        fs.writeFileSync(
          path.join(moduleDir, "ExpoDynamicAppIconModule.kt"),
          patchedModuleKt,
        );
      }
      return cfg;
    },
  ]);

const withDynamicSplashTheme: ConfigPlugin = (config) => {
  config = withOpenMainActivity(config);
  config = withImplActivities(config);
  config = withSplashColors(config);
  config = withSplashStyles(config);
  config = withAdaptiveIcons(config);
  config = withManifestRewrites(config);
  config = withPatchedDynamicAppIcon(config);
  return config;
};

export default withDynamicSplashTheme;
