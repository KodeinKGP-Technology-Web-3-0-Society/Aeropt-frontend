import { notFound } from "next/navigation";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On the production web deployment, /m/* is hidden and returns 404.
  // In development (local laptop testing) and in the Android build (BUILD_TARGET=android),
  // it is active and accessible.
  const isAndroidBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "android" || process.env.BUILD_TARGET === "android";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isAndroidBuild && !isDevelopment && process.env.NODE_ENV === "production") {
    notFound();
  }

  return <>{children}</>;
}
