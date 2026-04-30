'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { loadUserProjects } from '@/lib/supabase/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push('/');
          return;
        }

        const data = await loadUserProjects(session.user.id);
        setProjects(data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load your project database.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen p-8 md:p-12 bg-background">
      <header className="flex justify-between items-center mb-10 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and reload your saved structural states.</p>
        </div>
        <div className="space-x-4">
          <Button onClick={() => router.push('/calculator')}>+ New Calculation</Button>
          <Button variant="outline" onClick={handleLogout}>Log Out</Button>
        </div>
      </header>

      {loading ? (
        <div className="flex animate-pulse space-x-4">
          <div className="h-32 w-full bg-muted rounded-xl" />
          <div className="h-32 w-full bg-muted rounded-xl" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/10">
          <h3 className="font-semibold text-lg mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6">You haven't saved any beam configurations yet.</p>
          <Button onClick={() => router.push('/calculator')}>Launch Workspace</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-48"
            >
              <div>
                <h3 className="font-bold text-lg truncate">{proj.title}</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(proj.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                className="w-full mt-4"
                variant="secondary"
                onClick={() => {
                  toast.success(`Loading ${proj.title}...`);
                  router.push(`/calculator?id=${proj.id}`);
                }}
              >
                Open in Editor
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
