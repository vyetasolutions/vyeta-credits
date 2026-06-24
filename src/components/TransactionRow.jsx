import React from "react";
import { formatCredits, formatDate, reliabilityScore, initials } from "../lib/format.js";
import { Pill } from "./ui.jsx";

export default function TransactionRow({ tx, myId }) {
  const isOutgoing = tx.sender_id === myId;
  const counterpartName = isOutgoing ? tx.receiver_name : tx.sender_name;
  const score = reliabilityScore(tx.amount, tx.created_at);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-base-700 last:border-0 animate-riseIn">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${
          isOutgoing ? "bg-base-700 text-ink-300" : "bg-mint-500/15 text-mint-400"
        }`}
      >
        {initials(counterpartName)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">
          {isOutgoing ? `To ${counterpartName}` : `From ${counterpartName}`}
        </p>
        <p className="text-xs text-ink-500">{formatDate(tx.created_at)}</p>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-mono text-sm font-semibold ${isOutgoing ? "text-ink-100" : "text-mint-400"}`}>
          {isOutgoing ? "-" : "+"}
          {formatCredits(tx.amount)}
        </p>
        <div className="mt-0.5 flex justify-end">
          <Pill tone={score >= 95 ? "mint" : "violet"}>{score}% reliable</Pill>
        </div>
      </div>
    </div>
  );
}
