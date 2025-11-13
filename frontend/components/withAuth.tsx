import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function withAuth(
    Component: React.FC,
    allowedRoles: string[] = []
): React.FC {
    return () => {
        const router = useRouter();
        useEffect(() => {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");
            if (!token || !allowedRoles.includes(role || "")) {
                router.push("/login");
            }
        }, [router]);

        return <Component />;
    };
}
