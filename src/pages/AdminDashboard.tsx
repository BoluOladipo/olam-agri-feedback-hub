import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, LogOut, FileSpreadsheet, BarChart3, 
  ClipboardList, Users, Download, RefreshCw 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Submission {
  id: string;
  auditor_name: string;
  sample_a_code: string;
  sample_b_code: string;
  sample_c_code: string;
  submitted_at: string;
}

interface AnswerStats {
  option: string;
  count: number;
}

interface ProductStats {
  productName: string;
  questionStats: {
    questionText: string;
    stats: AnswerStats[];
  }[];
}

const COLORS = ['#FF6600', '#FF8533', '#FFA366', '#FFBF99', '#FFD9CC', '#99D6FF', '#66C2FF'];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"submissions" | "analytics">("submissions");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin");
    } else if (!authLoading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      signOut();
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, navigate, signOut, toast]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Fetch products and questions
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("display_order");

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .eq("question_type", "radio")
        .order("display_order");

      const { data: answers } = await supabase
        .from("submission_answers")
        .select("*");

      // Calculate stats for each product
      const stats: ProductStats[] = (products || []).map((product) => {
        const productQuestions = (questions || []).filter(q => q.product_id === product.id);
        
        const questionStats = productQuestions.map((question) => {
          const questionAnswers = (answers || []).filter(a => a.question_id === question.id);
          const options = question.options ? 
            (Array.isArray(question.options) ? question.options : JSON.parse(question.options as string)) : [];
          
          const stats: AnswerStats[] = options.map((option: string) => ({
            option,
            count: questionAnswers.filter(a => a.answer === option).length,
          }));

          return {
            questionText: question.question_text,
            stats: stats.filter(s => s.count > 0),
          };
        });

        return {
          productName: product.name,
          questionStats,
        };
      });

      setProductStats(stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, fetchData]);

  const exportToCSV = () => {
    if (submissions.length === 0) {
      toast({
        title: "No Data",
        description: "There are no submissions to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["ID", "Auditor Name", "Sample A Code", "Sample B Code", "Sample C Code", "Submitted At"];
    const csvContent = [
      headers.join(","),
      ...submissions.map(s => [
        s.id,
        `"${s.auditor_name}"`,
        s.sample_a_code,
        s.sample_b_code,
        s.sample_c_code,
        new Date(s.submitted_at).toLocaleString(),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `survey_submissions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Export Complete",
      description: "Submissions have been exported to CSV.",
    });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage submissions and view analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={signOut} className="btn-outline">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(submissions.map(s => s.auditor_name)).size}
                </p>
                <p className="text-sm text-muted-foreground">Auditors</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">9</p>
                <p className="text-sm text-muted-foreground">Samples</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "submissions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Submissions
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === "submissions" && (
          <div className="glass-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">All Submissions</h2>
              <button onClick={exportToCSV} className="btn-secondary text-sm">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Auditor</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sample A</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sample B</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sample C</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="p-4 text-sm font-medium text-foreground">{submission.auditor_name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{submission.sample_a_code}</td>
                        <td className="p-4 text-sm text-muted-foreground">{submission.sample_b_code}</td>
                        <td className="p-4 text-sm text-muted-foreground">{submission.sample_c_code}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-8">
            {productStats.map((product) => (
              <div key={product.productName} className="glass-card p-6">
                <h3 className="product-title mb-6">{product.productName}</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {product.questionStats.map((question, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-medium text-foreground mb-4">
                        {question.questionText}
                      </h4>
                      {question.stats.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={question.stats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="option"
                                label={({ option, percent }) => 
                                  `${option.substring(0, 10)}${option.length > 10 ? '...' : ''}: ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {question.stats.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No data available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
