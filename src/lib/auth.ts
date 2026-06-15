    import { useEffect, useState } from "react";
    import { supabase } from "./supabase";
    import type { User } from "@supabase/supabase-js";

    export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) { setLoading(false); return; }

        supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase?.auth.signOut();
    };

    const isAdmin = async (): Promise<boolean> => {
        if (!supabase || !user) return false;
        const { data } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();
        return data?.is_admin ?? false;
    };

    return { user, loading, signOut, isAdmin };
    }