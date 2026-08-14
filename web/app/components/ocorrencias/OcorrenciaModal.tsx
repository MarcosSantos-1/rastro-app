"use client";

import {
  deleteDenunciaCompleta,
  deleteDenunciaFoto,
  updateDenunciaStatus,
} from "@/lib/denuncia-actions";
import {
  STATUS_FILTERS,
  STATUS_LABEL,
  categoriaLabel,
  denunciaFotoUrls,
  type Denuncia,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { formatDateTimeBr } from "@/lib/format";
import { Bot, MapPin, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedModal } from "../ui/animated-modal";
import { ImagePixelLoader } from "../ui/image-pixel-loader";
import { InteractiveHoverButton } from "../ui/interactive-hover-button";
import { StatusBadge } from "../ui/status-badge";

export function OcorrenciaModal({
  denuncia,
  open,
  onClose,
}: {
  denuncia: Denuncia | null;
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<Denuncia | null>(denuncia);

  useEffect(() => {
    setLocal(denuncia);
    setError(null);
  }, [denuncia]);

  const fotos = useMemo(
    () => (local ? denunciaFotoUrls(local) : []),
    [local],
  );

  const hasIaResult =
    local != null &&
    (local.iaValida != null ||
      local.iaScore != null ||
      !!local.iaDescricao);

  if (!local) return null;

  const onStatus = async (status: DenunciaStatus) => {
    setBusy(true);
    setError(null);
    try {
      await updateDenunciaStatus(local.id, status);
      setLocal({ ...local, status, atualizadoEm: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar status");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteFoto = async (url: string) => {
    if (!confirm("Excluir esta foto? Se for a última, a ocorrência será removida.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await deleteDenunciaFoto(local, url);
      if (result.deleted) {
        onClose();
        return;
      }
      setLocal({
        ...local,
        fotoUrls: result.remaining,
        fotoUrl: result.remaining[0],
        atualizadoEm: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir foto");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAll = async () => {
    if (!confirm("Excluir esta ocorrência e todas as fotos? Esta ação não pode ser desfeita.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteDenunciaCompleta(local);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir ocorrência");
      setBusy(false);
    }
  };

  const iaTone =
    local.iaValida == null
      ? "amber"
      : local.iaValida
        ? "green"
        : "red";

  const iaBoxClass =
    iaTone === "green"
      ? "border-green-500/40 bg-green-500/10"
      : iaTone === "red"
        ? "border-red-500/40 bg-red-500/10"
        : "border-amber-500/35 bg-amber-500/10";

  const iaTitleClass =
    iaTone === "green"
      ? "text-green-700 dark:text-green-300"
      : iaTone === "red"
        ? "text-red-700 dark:text-red-300"
        : "text-amber-800 dark:text-amber-300";

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      subtitle={<span className="font-mono">{local.id}</span>}
      title={categoriaLabel(local.categoria)}
      headerRight={<StatusBadge status={local.status} />}
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Meta
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Município"
            value={local.municipio || "—"}
          />
          <Meta label="Endereço" value={local.endereco || "—"} className="sm:col-span-2" />
          <Meta label="Criada em" value={formatDateTimeBr(local.createdAt)} />
          <Meta
            label="Atualizada em"
            value={formatDateTimeBr(local.atualizadoEm ?? local.createdAt)}
          />
          {local.observacao ? (
            <Meta label="Observação" value={local.observacao} className="sm:col-span-2" />
          ) : null}
        </div>

        <div className={`rounded-xl border p-4 ${iaBoxClass}`}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            <Bot className="h-3.5 w-3.5" />
            Triagem IA
          </div>
          {!hasIaResult ? (
            local.iaErro ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Triagem falhou
                </p>
                <p className="text-sm text-[var(--foreground)]">{local.iaErro}</p>
              </div>
            ) : (
              <p className={`text-sm font-semibold ${iaTitleClass}`}>
                Aguardando análise em segundo plano…
              </p>
            )
          ) : (
            <div className="space-y-2">
              <p className={`text-base font-bold ${iaTitleClass}`}>
                {local.iaValida
                  ? `Válida · confiança ${local.iaScore ?? "—"}%`
                  : `Inválida · confiança ${local.iaScore ?? "—"}%`}
              </p>
              {local.iaDescricao ? (
                <p className="text-sm text-[var(--foreground)]">{local.iaDescricao}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <IaChip
                  label="Pessoas"
                  value={
                    local.iaContemPessoas == null
                      ? "—"
                      : local.iaContemPessoas
                        ? "Detectadas"
                        : "Não"
                  }
                  warn={local.iaContemPessoas === true}
                />
                <IaChip
                  label="Reciclável"
                  value={
                    local.iaReciclavel == null
                      ? "—"
                      : local.iaReciclavel
                        ? "Sim"
                        : "Não"
                  }
                />
                <IaChip
                  label="Score"
                  value={local.iaScore != null ? `${local.iaScore}%` : "—"}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Fotos ({fotos.length})
          </p>
          {fotos.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nenhuma foto anexada.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {fotos.map((url) => (
                <div key={url} className="relative">
                  <ImagePixelLoader src={url} alt="Foto da ocorrência" />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDeleteFoto(url)}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-red-600/90 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy || local.status === s || (local.status === "pendente" && s === "em_analise")}
                onClick={() => onStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  local.status === s || (local.status === "pendente" && s === "em_analise")
                    ? "bg-rastro-600 text-white dark:bg-rastro-500 dark:text-zinc-950"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <InteractiveHoverButton
            variant="danger"
            disabled={busy}
            onClick={onDeleteAll}
            className="h-10"
          >
            Excluir ocorrência
          </InteractiveHoverButton>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          >
            Fechar
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}

function IaChip({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
        warn
          ? "border-red-400/50 bg-red-500/15 text-red-800 dark:text-red-200"
          : "border-[var(--border)] bg-[var(--surface)]/80 text-[var(--foreground)]"
      }`}
    >
      <span className="text-[var(--muted)]">{label}</span>
      {value}
    </span>
  );
}

function Meta({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3.5 py-3 ${className ?? ""}`}>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
