import { AlertCircle, Loader2, Sparkles } from "lucide-react";

export function StateBlock({ tone = "loading", title, description, action }) {
  const Icon = tone === "error" ? AlertCircle : tone === "empty" ? Sparkles : Loader2;
  return (
    <div className={`stateBlock ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon className={tone === "loading" ? "spin" : ""} size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="stateAction">{action}</div> : null}
    </div>
  );
}
