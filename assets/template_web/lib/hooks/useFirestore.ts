"use client";

import { useState, useEffect, useCallback } from "react";
import { getEcopontos, getRegistros, getUsuarios } from "@/lib/firestore/collections";
import type { Ecoponto, Registro, Usuario } from "@/lib/firestore/types";

export function useEcopontos() {
  const [data, setData] = useState<Ecoponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getEcopontos();
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar ecopontos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: data, loading, error, refetch };
}

export function useRegistros() {
  const [data, setData] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getRegistros();
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar registros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useUsuarios() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getUsuarios();
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
