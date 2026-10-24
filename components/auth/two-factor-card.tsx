"use client";

import { useState } from "react";
import { RecoveryCodesPanel, TotpSetupPanel } from "@/components/auth/totp-setup";
import { Icon } from "@/components/icons";
import { Badge, Button, FormCard } from "@/components/ui";
import { useTwoFactorStatus } from "@/lib/api/auth";
import { useRecoveryCodesStore } from "@/lib/stores/recovery-codes-store";

/** Settings card: current second factor, and switching to an authenticator app. */
export function TwoFactorCard() {
  const status = useTwoFactorStatus();
  const [settingUp, setSettingUp] = useState(false);
  const codes = useRecoveryCodesStore((s) => s.codes);
  const clearCodes = useRecoveryCodesStore((s) => s.clear);
  const mode = codes ? "codes" : settingUp && !status.data?.totp_enabled ? "setup" : "idle";

  const appOn = status.data?.totp_enabled;

  return (
    <FormCard
      title="Two-Factor Authentication"
      description={
        appOn
          ? "Sign-in asks for a code from your authenticator app. If your phone isn’t with you, use a recovery code or have a code emailed instead."
          : "Sign-in asks for a 6-digit code emailed to the owner address. An authenticator app is faster and can’t be intercepted by email."
      }
      footer={
        status.data && (
          <span className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-ok">
              <Icon name="check-circle" size={14} /> {appOn ? "Authenticator app" : "Email codes"}
            </span>
            {appOn && (
              <Badge tone={status.data.recovery_codes_remaining > 2 ? "neutral" : "warn"}>
                {status.data.recovery_codes_remaining} recovery codes left
              </Badge>
            )}
          </span>
        )
      }
      action={
        !appOn &&
        mode === "idle" && (
          <Button variant="primary" size="sm" icon="shield-check" onClick={() => setSettingUp(true)} disabled={status.isLoading}>
            Set Up Authenticator App
          </Button>
        )
      }
    >
      {mode === "setup" && (
        <div className="rounded-xl border border-black/[0.06] bg-bg-100 p-5">
          <TotpSetupPanel onCancel={() => setSettingUp(false)} />
        </div>
      )}
      {mode === "codes" && (
        <div className="rounded-xl border border-black/[0.06] bg-bg-100 p-5">
          <RecoveryCodesPanel
            codes={codes ?? []}
            doneLabel="Done"
            onDone={() => {
              clearCodes();
              setSettingUp(false);
            }}
          />
        </div>
      )}
    </FormCard>
  );
}
