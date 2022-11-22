import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
