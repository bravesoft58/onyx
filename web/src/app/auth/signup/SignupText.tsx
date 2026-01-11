"use client";

import React, { useContext } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import Text from "@/refresh-components/texts/Text";

export default function SignupText({ cloud }: { cloud?: boolean }) {
  const settings = useContext(SettingsContext);
  const appName =
    (settings && settings?.enterpriseSettings?.application_name) || "Onyx";

  return (
    <div className="w-full">
      <Text headingH2 text05>
        {cloud ? "Complete your sign up" : "Create account"}
      </Text>
      {!settings?.enterpriseSettings?.application_name && (
        <Text text03>Get started with {appName}</Text>
      )}
    </div>
  );
}
