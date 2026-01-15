import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight, ClipboardList, BarChart3, ShieldCheck } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              External Auditor Survey
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
              Product Quality
              <span className="block gradient-text">Assessment Survey</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Help us maintain the highest quality standards by evaluating our product samples. 
              Your feedback is essential for continuous improvement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/survey" className="btn-primary text-lg">
                Start Survey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/admin" className="btn-outline text-lg">
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Survey Overview
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Evaluate three key products across multiple samples with comprehensive questions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-6 md:p-8 slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <ClipboardList className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                3 Products
              </h3>
              <p className="text-muted-foreground">
                Evaluate Raw Paste, Stew, and Jollof Rice with detailed quality questions for each.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card p-6 md:p-8 slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                9 Sample Evaluations
              </h3>
              <p className="text-muted-foreground">
                Each product has three samples (A, B, C) for comprehensive comparative analysis.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card p-6 md:p-8 slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                Secure Submission
              </h3>
              <p className="text-muted-foreground">
                All responses are securely stored and accessible only to authorized administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Products to Evaluate
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Raw Paste", desc: "Evaluate texture, aroma, and overall quality" },
              { name: "Stew", desc: "Assess flavor profile, consistency, and appearance" },
              { name: "Jollof Rice", desc: "Review taste, texture, and presentation" },
            ].map((product, index) => (
              <div 
                key={product.name}
                className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-300 slide-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {product.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Ready to Begin?
            </h2>
            <p className="text-muted-foreground mb-8">
              The survey takes approximately 15-20 minutes to complete. Please ensure you have all sample materials ready before starting.
            </p>
            <Link to="/survey" className="btn-primary text-lg">
              Start Survey Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
