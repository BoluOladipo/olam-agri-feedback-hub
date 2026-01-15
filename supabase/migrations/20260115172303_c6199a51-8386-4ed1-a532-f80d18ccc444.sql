-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default products
INSERT INTO public.products (name, display_order) VALUES
('Raw Paste', 1),
('Stew', 2),
('Jollof Rice', 3);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT USING (true);

-- Only admins can modify products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'radio', -- 'radio', 'text', 'textarea'
    options JSONB, -- Array of option strings for radio/dropdown
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can view questions
CREATE POLICY "Questions are viewable by everyone"
ON public.questions FOR SELECT USING (true);

-- Only admins can modify questions
CREATE POLICY "Admins can insert questions"
ON public.questions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
ON public.questions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_name TEXT NOT NULL,
    sample_a_code TEXT NOT NULL,
    sample_b_code TEXT NOT NULL,
    sample_c_code TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert submissions (public survey)
CREATE POLICY "Anyone can submit"
ON public.submissions FOR INSERT
WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view submissions"
ON public.submissions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create submission_answers table
CREATE TABLE public.submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sample_type TEXT NOT NULL, -- 'A', 'B', 'C'
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submission_answers
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert answers
CREATE POLICY "Anyone can submit answers"
ON public.submission_answers FOR INSERT
WITH CHECK (true);

-- Only admins can view answers
CREATE POLICY "Admins can view answers"
ON public.submission_answers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for admin users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default questions for each product
DO $$
DECLARE
  raw_paste_id UUID;
  stew_id UUID;
  jollof_id UUID;
BEGIN
  SELECT id INTO raw_paste_id FROM public.products WHERE name = 'Raw Paste';
  SELECT id INTO stew_id FROM public.products WHERE name = 'Stew';
  SELECT id INTO jollof_id FROM public.products WHERE name = 'Jollof Rice';
  
  -- Raw Paste questions
  INSERT INTO public.questions (product_id, question_text, question_type, options, display_order) VALUES
  (raw_paste_id, 'How would you rate the overall appearance?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 1),
  (raw_paste_id, 'How would you rate the aroma?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 2),
  (raw_paste_id, 'How would you rate the texture/consistency?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 3),
  (raw_paste_id, 'How would you rate the overall taste?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 4),
  (raw_paste_id, 'Any additional comments about the Raw Paste?', 'textarea', NULL, 5);
  
  -- Stew questions
  INSERT INTO public.questions (product_id, question_text, question_type, options, display_order) VALUES
  (stew_id, 'How would you rate the overall appearance?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 1),
  (stew_id, 'How would you rate the aroma?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 2),
  (stew_id, 'How would you rate the texture?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 3),
  (stew_id, 'How would you rate the overall taste?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 4),
  (stew_id, 'Any additional comments about the Stew?', 'textarea', NULL, 5);
  
  -- Jollof Rice questions
  INSERT INTO public.questions (product_id, question_text, question_type, options, display_order) VALUES
  (jollof_id, 'How would you rate the overall appearance?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 1),
  (jollof_id, 'How would you rate the aroma?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 2),
  (jollof_id, 'How would you rate the rice texture?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 3),
  (jollof_id, 'How would you rate the overall taste?', 'radio', '["Like Very Much", "Like Moderately", "Like Slightly", "Neither Like nor Dislike", "Dislike Slightly", "Dislike Moderately", "Dislike Very Much"]', 4),
  (jollof_id, 'Any additional comments about the Jollof Rice?', 'textarea', NULL, 5);
END $$;