import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  display_order: number;
}

interface Question {
  id: string;
  product_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  display_order: number;
}

const QUESTION_TYPES = [
  { value: "radio", label: "Multiple Choice (Radio)" },
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
];

export const QuestionManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "radio",
    options: [""],
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchQuestions();
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("product_id", selectedProductId)
        .order("display_order");

      if (error) throw error;
      
      // Parse options from JSON
      const parsedQuestions = (data || []).map(q => ({
        ...q,
        options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)) : null,
      }));
      
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions.",
        variant: "destructive",
      });
    }
  };

  const openNewQuestionDialog = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: "",
      question_type: "radio",
      options: [""],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [""],
    });
    setDialogOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleSave = async () => {
    if (!formData.question_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.question_type === "radio" && formData.options.filter(o => o.trim()).length < 2) {
      toast({
        title: "Validation Error",
        description: "Radio questions need at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const questionData = {
        product_id: selectedProductId,
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        options: formData.question_type === "radio" 
          ? formData.options.filter(o => o.trim())
          : null,
        display_order: editingQuestion?.display_order ?? questions.length,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("questions")
          .insert(questionData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question created successfully.",
        });
      }

      setDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: "Failed to save question.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", deletingQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });

      setDeleteDialogOpen(false);
      setDeletingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    return QUESTION_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="product-select" className="text-sm font-medium mb-2 block">
              Select Product
            </Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select" className="w-full sm:w-64">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openNewQuestionDialog} className="self-end">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="glass-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            Questions for {products.find(p => p.id === selectedProductId)?.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""} configured
          </p>
        </div>

        <div className="divide-y divide-border">
          {questions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No questions configured for this product.</p>
              <p className="text-sm mt-1">Click "Add Question" to get started.</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <div
                key={question.id}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-medium w-6">{index + 1}.</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">{question.question_text}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {getQuestionTypeLabel(question.question_type)}
                    </p>
                    {question.options && question.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {question.options.map((option, optIdx) => (
                          <span
                            key={optIdx}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(question)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingQuestion(question);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question_text">Question Text</Label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question_type">Question Type</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value) => setFormData({ ...formData, question_type: value })}
              >
                <SelectTrigger id="question_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.question_type === "radio" && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {formData.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingQuestion ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <p className="font-medium text-foreground mt-2">
            "{deletingQuestion?.question_text}"
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
