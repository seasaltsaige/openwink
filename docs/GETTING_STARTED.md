# Getting Started

If you already have an OpenWink module installed, start by installing the app below. If you still need to fit the module to your car, see the [installation guide](./INSTALLATION.md).

OpenWink is designed for 1989 to 1997 NA Mazda MX5 Miatas with pop up headlights. Some features have only been tested on certain years, so please let us know how things work on yours!

## Install the App

### Android

Download the app's `.apk` file from the [release page](https://github.com/seasaltsaige/openwink/releases). Open it on your phone and follow the installation prompts. Android may ask you to allow installation from the browser or file manager you used to open it.

Read the release notes before installing, especially if you are updating an older setup.

If you would rather compile the app yourself, follow the [app build instructions](../openwink-app/README.md#getting-started).

### iOS

There is no App Store release yet. You will need to compile and install your own build. See the [iOS build instructions](../openwink-app/README.md#creating-a-development-build-for-ios-without-a-developer-account). Local iOS builds require a Mac with Xcode and an iPhone to test the Bluetooth connection.

## Connect to your Module

1. Turn on Bluetooth on your phone, open OpenWink, and finish the introduction.
2. Stay near the car and press the dashboard headlight retractor button once. This wakes the module and keeps it available for connection for about five minutes.
3. On the Home screen, press **Scan for Wink Module**. Allow the Bluetooth permissions the app requests. On Android, the app also requests location permission for scanning.
4. Wait for the button to say **Connected to Module**.

Pair through the OpenWink app. The module gives the app a pairing key on the first connection, and the app saves it for future connections. You do not need to enter a PIN.

Once connected, you can enable **Auto Connect** under **Settings → Module Settings** if you would like the app to look for your module automatically.

## Try a Wink

With the car parked and the headlight mechanisms clear, open **Default Commands** from the Home screen. Try raising and lowering both headlights, then try a left or right wink. The car shown in the app should follow the headlights as they move.

Left and right normally refer to the view from inside the car. You can change the perspective under **Settings → Module Settings** if you prefer the view from in front of the car.

From here, you can adjust wave timing and sleepy eye positions, assign actions to the retractor button, or make your own sequences with **Create Custom Commands**. The **Help → App Usage** page explains these controls in more detail.

## Check for Updates

The **Updates** section on the Home screen has separate entries for the app and the module firmware. You need an internet connection to download either update, and a Bluetooth connection to the module to install firmware.

If an update is available, open it and read the description before installing. Some firmware updates need a newer app version first. The app will tell you when this is required. Older firmware may need several updates in sequence, with the module restarting between them.

Stay close to the car, keep the app open, and leave the module powered while a firmware update is running. Once it finishes and reconnects, check the firmware version under **Settings → System Information** and try a command again.

Some app updates install directly through OpenWink and restart the app. If an update needs a new build, follow the [app installation steps](#install-the-app) above.

App OTA updates require a release build. If you are running a development build, update your source and rebuild when needed.

## Having Trouble Connecting?

Check Bluetooth and the app's permissions first. Press the retractor button to wake the module, then scan again while standing close to the car. If that does not help, restart the app and check that the module's connectors are fully seated.

If the module was paired with another phone, connect with that phone and use **Settings → Module Settings → Danger Zone → Forget Module** before pairing the new one. Forgetting a module while disconnected only removes the pairing information from that phone; it does not clear the key stored on the module.

If you no longer have access to the paired phone, pressing the retractor button twenty times in a row resets the module, including its pairing key and saved module settings. Keep the presses within the configured **Press Interval**. This resets the module's configuration, so use it only when you are ready to set it up again. It does not erase profiles saved on a disconnected phone.

For more help, check **Help → Troubleshooting** in the app or ask in the [Discord server](https://discord.gg/jaP67bgZBM). Include your phone model, app and firmware versions, and the year of your car so we have somewhere to start.

Happy Winking!
