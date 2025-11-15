BEGIN;

-- Verificar que tenemos las extensiones necesarias de Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Para generar UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;         -- Para funciones de encriptación
CREATE EXTENSION IF NOT EXISTS pgjwt;            -- Para manejo de JWT

-- Create utility functions
CREATE OR REPLACE FUNCTION execute_sql_script(sql_script text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_script;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create base tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  learning_level TEXT DEFAULT 'beginner',
  preferred_language TEXT DEFAULT 'es',
  accessibility_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER,
  prerequisites TEXT[],
  learning_objectives TEXT[],
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_skills TEXT[],
  generated_by_ai BOOLEAN DEFAULT true,
  path_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_sections TEXT[],
  time_spent INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, learning_path_id)
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  certificate_data JSONB NOT NULL DEFAULT '{}',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  feedback_type TEXT DEFAULT 'course' CHECK (feedback_type IN ('course', 'path', 'platform')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create course_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    content JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create section_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS section_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_content ENABLE ROW LEVEL SECURITY;

-- Add created_by column to courses if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'courses' AND column_name = 'created_by') THEN
        ALTER TABLE courses ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create user profile handling function with Supabase auth schema
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  final_username TEXT;
  base_username TEXT;
BEGIN
    base_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
    final_username := base_username;

    -- Check for conflicts and append a short hash if needed
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
        final_username := base_username || '_' || SUBSTRING(md5(random()::text), 1, 4);
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        username,
        email,
        avatar_url
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        final_username,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create timestamp update trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view active courses" 
    ON courses FOR SELECT 
    USING (is_active = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create courses" 
    ON courses FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own courses" 
    ON courses FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ));

CREATE POLICY "Users can delete own courses" 
    ON courses FOR DELETE 
    TO authenticated 
    USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ));

-- Course sections policies
CREATE POLICY "Anyone can view active course sections" 
    ON course_sections FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = course_sections.course_id
        AND courses.is_active = true
    ));

CREATE POLICY "Course creators can insert sections" 
    ON course_sections FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = course_sections.course_id
        AND courses.created_by = auth.uid()
    ));

CREATE POLICY "Course creators can update sections" 
    ON course_sections FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = course_sections.course_id
        AND courses.created_by = auth.uid()
    ));

CREATE POLICY "Course creators can delete sections" 
    ON course_sections FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = course_sections.course_id
        AND courses.created_by = auth.uid()
    ));

-- Section content policies
CREATE POLICY "Anyone can view active course content" 
    ON section_content FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM course_sections
        JOIN courses ON courses.id = course_sections.course_id
        WHERE course_sections.id = section_content.section_id
        AND courses.is_active = true
    ));

CREATE POLICY "Course creators can manage content" 
    ON section_content FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM course_sections
        JOIN courses ON courses.id = course_sections.course_id
        WHERE course_sections.id = section_content.section_id
        AND courses.created_by = auth.uid()
    ));

-- Learning paths policies
CREATE POLICY "Users can view own learning paths" 
    ON learning_paths FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning paths" 
    ON learning_paths FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths" 
    ON learning_paths FOR UPDATE 
    USING (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view own progress" 
    ON user_progress FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
    ON user_progress FOR ALL 
    USING (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view own certificates" 
    ON certificates FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can create certificates" 
    ON certificates FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" 
    ON feedback FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" 
    ON feedback FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Set up Supabase specific roles and permissions
-- Supabase roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
    END IF;
END
$$;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Supabase realtime setup
ALTER PUBLICATION supabase_realtime ADD TABLE courses, course_sections, user_progress;

-- Enable Supabase dashboard management access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Add soft delete functionality
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create soft delete functions
CREATE OR REPLACE FUNCTION soft_delete_course(course_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE courses
    SET deleted_at = NOW(),
        is_active = false
    WHERE id = course_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_section(section_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE course_sections
    SET deleted_at = NOW()
    WHERE id = section_uuid;
END;
$$ LANGUAGE plpgsql;

-- Modify existing policies to exclude deleted items
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
CREATE POLICY "Anyone can view active courses" 
    ON courses FOR SELECT 
    USING ((is_active = true AND deleted_at IS NULL) OR auth.uid() = created_by);

COMMIT;

-- Additional schema for content management (private-by-default storage support)
BEGIN;

-- Content table: stores uploaded assets metadata
CREATE TABLE IF NOT EXISTS content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('video','audio','image','blog','misc')),
    file_url TEXT,             -- optional (legacy or signed URL used immediately, not persisted long-term)
    file_path TEXT,            -- storage path like "type/userId/timestamp.ext"
    transcription TEXT,
    duration INTEGER,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link table: associates content to courses
CREATE TABLE IF NOT EXISTS course_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, content_id)
);

-- Triggers to keep updated_at fresh
DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_created_by ON content(created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_course_content_course ON course_content(course_id, content_id);

-- RLS policies for content
-- Owners can manage their content
CREATE POLICY IF NOT EXISTS "Content owners can manage" ON content
    FOR ALL TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can view content if they own it OR are enrolled in a course that links it
CREATE POLICY IF NOT EXISTS "View content if owner or enrolled" ON content
    FOR SELECT TO authenticated
    USING (
        auth.uid() = created_by OR EXISTS (
            SELECT 1 FROM course_content cc
            JOIN user_progress up ON up.course_id = cc.course_id
            WHERE cc.content_id = content.id AND up.user_id = auth.uid()
        )
    );

-- RLS policies for course_content
-- Course owners can manage links
CREATE POLICY IF NOT EXISTS "Course owners manage links" ON course_content
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM courses c WHERE c.id = course_content.course_id AND c.created_by = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM courses c WHERE c.id = course_content.course_id AND c.created_by = auth.uid()
    ));

-- Allow enrolled users to view course_content rows for their courses
CREATE POLICY IF NOT EXISTS "Enrolled users can view course_content" ON course_content
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_progress up WHERE up.course_id = course_content.course_id AND up.user_id = auth.uid()
    ));

COMMIT;
