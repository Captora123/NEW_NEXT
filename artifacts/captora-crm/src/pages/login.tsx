import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Login failed", description: "Invalid username or password" });
      }
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ background: "#1E293B" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E0533C" }}>
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Captora</p>
            <p className="text-slate-400 text-xs leading-none mt-0.5">Photography Studio</p>
          </div>
        </div>
        <div>
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Manage your studio<br />from one place.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Track clients, shoots, payments, and deliverables — all in a clean, powerful dashboard built for creative studios.
          </p>
        </div>
        <p className="text-slate-600 text-xs">© 2026 Captora Photography, Lucknow</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E0533C" }}>
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-800 text-lg">Captora</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your studio dashboard</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-slate-700 font-medium text-sm">Username</Label>
              <Input
                id="username"
                {...form.register("username")}
                className="h-11 rounded-lg border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#E0533C] focus-visible:border-[#E0533C]"
                placeholder="Enter your username"
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="h-11 rounded-lg border-slate-200 bg-white text-slate-800 focus-visible:ring-1 focus-visible:ring-[#E0533C] focus-visible:border-[#E0533C]"
                placeholder="Enter your password"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold transition-all mt-2 disabled:opacity-70"
              style={{ background: "#E0533C" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C9432C"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E0533C"; }}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
