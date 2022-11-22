import type { NextPage } from "next";
import {
  getDefaultWallets,
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
} from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import Siwe from "../components/Siwe";
import { useEffect, useState } from "react";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum, chain.goerli],
  [
    alchemyProvider({ apiKey: "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC" }), // Taken from Rainbowkit
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "My SIWE Example App",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const Honme: NextPage = () => {
  const [authenticationStatus, setAuthenticationStatus] = useState<
    "loading" | "unauthenticated" | "authenticated"
  >("loading");
  const [hasMounted, setHasMounted] = useState(false);

  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const response = await fetch("/api/auth/nonce");
      const res = await response.text();
      return res;
    },
    createMessage: ({ nonce, address, chainId }) => {
      return new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
    },
    getMessageBody: ({ message }) => {
      return message.prepareMessage();
    },
    verify: async ({ message, signature }) => {
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          signature,
        }),
      });
      setAuthenticationStatus(
        verifyRes.ok ? "authenticated" : "unauthenticated"
      );
      return Boolean(verifyRes.ok);
    },
    signOut: async () => {
      await fetch("/api/auth/logout");
      setAuthenticationStatus("unauthenticated");
    },
  });

  useEffect(() => {
    const fetchAuthStatus = async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {
        setAuthenticationStatus("unauthenticated");
      } else {
        setAuthenticationStatus("authenticated");
      }
    };
    fetchAuthStatus();
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitAuthenticationProvider
        adapter={authenticationAdapter}
        status={authenticationStatus}
      >
        <RainbowKitProvider chains={chains}>
          {hasMounted && <Siwe />}
        </RainbowKitProvider>
      </RainbowKitAuthenticationProvider>
    </WagmiConfig>
  );
};

export default Honme;
