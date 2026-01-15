import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Question {
  id: string;
  product_id: string;
  question_text: string;
  question_type: "radio" | "text" | "textarea";
  options: string[] | null;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  display_order: number;
  questions: Question[];
}

export interface SurveyAnswer {
  product_id: string;
  sample_type: "A" | "B" | "C";
  question_id: string;
  answer: string;
}

export interface SurveyFormData {
  auditor_name: string;
  sample_a_code: string;
  sample_b_code: string;
  sample_c_code: string;
  answers: Record<string, Record<string, Record<string, string>>>; // product_id -> sample_type -> question_id -> answer
  previousAnswers: Record<string, string>; // For tracking previous answers per question sequence
}

export const useSurvey = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<SurveyFormData>({
    auditor_name: "",
    sample_a_code: "",
    sample_b_code: "",
    sample_c_code: "",
    answers: {},
    previousAnswers: {},
  });

  const fetchSurveyData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("display_order");
      
      if (productsError) throw productsError;
      
      // Fetch questions for all products
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .order("display_order");
      
      if (questionsError) throw questionsError;
      
      // Combine products with their questions
      const productsWithQuestions: Product[] = (productsData || []).map((product) => ({
        ...product,
        questions: (questionsData || [])
          .filter((q) => q.product_id === product.id)
          .map((q) => ({
            ...q,
            question_type: q.question_type as "radio" | "text" | "textarea",
            options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)) : null,
          })),
      }));
      
      setProducts(productsWithQuestions);
    } catch (error) {
      console.error("Error fetching survey data:", error);
      toast({
        title: "Error",
        description: "Failed to load survey data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAnswer = useCallback((
    productId: string,
    sampleType: "A" | "B" | "C",
    questionId: string,
    answer: string
  ) => {
    setFormData((prev) => {
      const newAnswers = { ...prev.answers };
      
      if (!newAnswers[productId]) {
        newAnswers[productId] = {};
      }
      if (!newAnswers[productId][sampleType]) {
        newAnswers[productId][sampleType] = {};
      }
      
      const answerKey = `${productId}-${sampleType}-${questionId}`;
      const previousAnswers = { ...prev.previousAnswers };
      
      // Store the previous answer if we're updating
      if (newAnswers[productId][sampleType][questionId]) {
        previousAnswers[answerKey] = newAnswers[productId][sampleType][questionId];
      }
      
      newAnswers[productId][sampleType][questionId] = answer;
      
      return {
        ...prev,
        answers: newAnswers,
        previousAnswers,
      };
    });
  }, []);

  const getDisabledOptions = useCallback((
    productId: string,
    sampleType: "A" | "B" | "C",
    currentQuestionIndex: number,
    questions: Question[]
  ): string[] => {
    if (currentQuestionIndex === 0) return [];
    
    const prevQuestion = questions[currentQuestionIndex - 1];
    if (!prevQuestion || prevQuestion.question_type !== "radio") return [];
    
    const prevAnswer = formData.answers[productId]?.[sampleType]?.[prevQuestion.id];
    
    if (!prevAnswer) return [];
    
    // Get all options except the one selected in the previous question and "OK" / neutral options
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion?.options) return [];
    
    return currentQuestion.options.filter(opt => 
      opt !== prevAnswer && 
      opt.toLowerCase() !== "ok" &&
      opt !== "Neither Like nor Dislike"
    );
  }, [formData.answers]);

  const validateForm = useCallback((): boolean => {
    if (!formData.auditor_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.sample_a_code.trim() || !formData.sample_b_code.trim() || !formData.sample_c_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter codes for all samples.",
        variant: "destructive",
      });
      return false;
    }
    
    // Check all questions are answered
    for (const product of products) {
      for (const sampleType of ["A", "B", "C"] as const) {
        for (const question of product.questions) {
          const answer = formData.answers[product.id]?.[sampleType]?.[question.id];
          if (!answer || !answer.trim()) {
            toast({
              title: "Validation Error",
              description: `Please answer all questions for ${product.name} - Sample ${sampleType}.`,
              variant: "destructive",
            });
            return false;
          }
        }
      }
    }
    
    return true;
  }, [formData, products, toast]);

  const submitSurvey = useCallback(async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Create submission
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          auditor_name: formData.auditor_name,
          sample_a_code: formData.sample_a_code,
          sample_b_code: formData.sample_b_code,
          sample_c_code: formData.sample_c_code,
        })
        .select()
        .single();
      
      if (submissionError) throw submissionError;
      
      // Prepare answers for bulk insert
      const answersToInsert: {
        submission_id: string;
        product_id: string;
        sample_type: string;
        question_id: string;
        answer: string;
      }[] = [];
      
      for (const productId of Object.keys(formData.answers)) {
        for (const sampleType of Object.keys(formData.answers[productId])) {
          for (const questionId of Object.keys(formData.answers[productId][sampleType])) {
            answersToInsert.push({
              submission_id: submission.id,
              product_id: productId,
              sample_type: sampleType,
              question_id: questionId,
              answer: formData.answers[productId][sampleType][questionId],
            });
          }
        }
      }
      
      // Insert all answers
      const { error: answersError } = await supabase
        .from("submission_answers")
        .insert(answersToInsert);
      
      if (answersError) throw answersError;
      
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your survey has been submitted successfully.",
      });
      
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, toast]);

  const updateFormField = useCallback((field: keyof SurveyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
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
  };
};
