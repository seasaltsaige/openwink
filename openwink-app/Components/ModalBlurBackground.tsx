import { BlurView } from "expo-blur";

export function ModalBlurBackground({ children }: React.PropsWithChildren) {
  return (
    <BlurView
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
      experimentalBlurMethod="dimezisBlurView"
      intensity={6}
    >
      {children}
    </BlurView>
  )
}