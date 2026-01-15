import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductSection } from "@/components/survey/ProductSection";
import { SampleSection } from "@/components/survey/SampleSection";
import { SampleInfoFields } from "@/components/survey/SampleInfoFields";
import { QuestionInput } from "@/components/survey/QuestionInput";
import { useSurvey } from "@/hooks/useSurvey";
import { Loader2, CheckCircle, Send } from "lucide-react";

const Survey = () => {
  const {
    products,
    loading,
    submitting,
    submitted,
    formData,
    fetchSurveyData,
    updateAnswer,
    updateFormField,
    getDisabledOptions,
    submitSurvey,
    setSubmitted,
  } = useSurvey();

  useEffect(() => {
    fetchSurveyData();
  }, [fetchSurveyData]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading survey...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Thank You!
            </h1>
            <p className="text-muted-foreground mb-8">
              Your survey responses have been submitted successfully. We appreciate your valuable feedback.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                window.location.reload();
              }}
              className="btn-primary"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Product Quality Survey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please evaluate each product sample carefully and provide your honest feedback. 
            All fields marked with <span className="text-destructive">*</span> are required.
          </p>
        </div>

        {/* Survey Form */}
        <form onSubmit={(e) => { e.preventDefault(); submitSurvey(); }} className="space-y-12">
          {products.map((product) => (
            <ProductSection key={product.id} productName={product.name}>
              {/* Sample A */}
              <SampleSection sampleLabel="Sample A" sampleType="A">
                <SampleInfoFields
                  sampleType="A"
                  name={formData.auditor_name}
                  code={formData.sample_a_code}
                  onNameChange={(value) => updateFormField("auditor_name", value)}
                  onCodeChange={(value) => updateFormField("sample_a_code", value)}
                />
                {product.questions.map((question, index) => (
                  <QuestionInput
                    key={question.id}
                    questionNumber={index + 1}
                    questionText={question.question_text}
                    questionType={question.question_type}
                    options={question.options || []}
                    value={formData.answers[product.id]?.["A"]?.[question.id] || ""}
                    onChange={(value) => updateAnswer(product.id, "A", question.id, value)}
                    disabledOptions={getDisabledOptions(product.id, "A", index, product.questions)}
                  />
                ))}
              </SampleSection>

              {/* Sample B */}
              <SampleSection sampleLabel="Sample B" sampleType="B">
                <SampleInfoFields
                  sampleType="B"
                  code={formData.sample_b_code}
                  onCodeChange={(value) => updateFormField("sample_b_code", value)}
                />
                {product.questions.map((question, index) => (
                  <QuestionInput
                    key={question.id}
                    questionNumber={index + 1}
                    questionText={question.question_text}
                    questionType={question.question_type}
                    options={question.options || []}
                    value={formData.answers[product.id]?.["B"]?.[question.id] || ""}
                    onChange={(value) => updateAnswer(product.id, "B", question.id, value)}
                    disabledOptions={getDisabledOptions(product.id, "B", index, product.questions)}
                  />
                ))}
              </SampleSection>

              {/* Sample C */}
              <SampleSection sampleLabel="Sample C" sampleType="C">
                <SampleInfoFields
                  sampleType="C"
                  code={formData.sample_c_code}
                  onCodeChange={(value) => updateFormField("sample_c_code", value)}
                />
                {product.questions.map((question, index) => (
                  <QuestionInput
                    key={question.id}
                    questionNumber={index + 1}
                    questionText={question.question_text}
                    questionType={question.question_type}
                    options={question.options || []}
                    value={formData.answers[product.id]?.["C"]?.[question.id] || ""}
                    onChange={(value) => updateAnswer(product.id, "C", question.id, value)}
                    disabledOptions={getDisabledOptions(product.id, "C", index, product.questions)}
                  />
                ))}
              </SampleSection>
            </ProductSection>
          ))}

          {/* Fixed Submit Button */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 -mx-4 px-4 md:-mx-8 md:px-8">
            <div className="container">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full md:w-auto md:min-w-[200px] mx-auto flex"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Survey
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Survey;
