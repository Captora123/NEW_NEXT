import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
        toast({ title: "Welcome back", description: "Successfully logged in." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Login failed", description: "Invalid username or password" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">CAP<span className="text-foreground">TORA</span></h1>
          <p className="text-sm text-muted-foreground">Command Center</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...form.register("username")} className="bg-input" />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} className="bg-input" />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full mt-6 text-primary-foreground font-semibold" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Authenticating..." : "Login to Command Center"}
          </Button>
        </form>
      </div>
    </div>
  );
}
