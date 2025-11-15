'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider-enhanced'
import { getFirestoreDb } from '@/src/infrastructure/firebase/client'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { Button } from '@/components/ui/button'

export default function DatabaseFixer() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [sqlFixes, setSqlFixes] = useState<any[]>([])
  const { user } = useAuth()

  // Deprecated: SQL fixes for Supabase no longer apply.
  const getSqlFixes = async () => {
    setSqlFixes([])
    setMessage('ℹ️ Herramienta de SQL (Supabase) obsoleta tras migración a Firebase.')
  }

  const fixDatabase = async () => {
    setIsLoading(true)
    setMessage('')
    setResults([])

    try {
      if (!user) {
        setResults([{ test: 'Auth', success: false, error: 'Usuario no autenticado' }])
        setMessage('❌ Autenticación requerida')
        return
      }
      const db = getFirestoreDb()
      const col = collection(db, 'courses')
      const q = query(col, limit(1))
      const snap = await getDocs(q)
      setResults([
        { test: 'Auth', success: true, data: { uid: user.uid, email: user.email } },
        { test: 'Firestore courses read', success: true, data: snap.docs.map(d => ({ id: d.id, title: d.get('title') })) }
      ])
      setMessage('✅ Diagnóstico Firebase completado')
    } catch (e:any) {
      setResults(prev => [...prev, { test: 'Firestore access', success: false, error: e.message }])
      setMessage(`❌ Error: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-6 bg-white border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🔧 Firebase Diagnostics</h3>
        <div className="flex gap-2">
          {!user && (
            <Button 
              onClick={() => window.location.href = '/auth/login'}
              variant="secondary"
              size="sm"
            >
              🔐 Login First
            </Button>
          )}
          <Button onClick={fixDatabase} disabled={isLoading} variant="outline">
            {isLoading ? '🔄 Analizando...' : '🔍 Ejecutar Diagnóstico'}
          </Button>
          <Button onClick={getSqlFixes} variant="default">
            🗑️ SQL (Supabase) Obsoleto
          </Button>
        </div>
      </div>

      {!user && (
        <div className="p-3 rounded bg-yellow-100 text-yellow-800">
          ⚠️ User not authenticated. Please log in to run database diagnostics.
        </div>
      )}

      {message && (
        <div className={`p-3 rounded ${
          message.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Results:</h4>
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-3 rounded text-sm ${
                result.success 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-red-100 border border-red-300'
              }`}
            >
              <div className="font-medium">
                {result.success ? '✅' : '❌'} {result.test}
              </div>
              {result.error && (
                <div className="text-red-700 mt-1">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              {result.details && (
                <div className="text-gray-600 mt-1">
                  <strong>Details:</strong> {result.details}
                </div>
              )}
              {result.message && (
                <div className="text-gray-700 mt-1">
                  {result.message}
                </div>
              )}
              {sqlFixes.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  Herramienta de SQL para Supabase eliminada. Usa reglas Firestore para seguridad.
                </div>
              )}
          If the diagnostics show RLS policy errors, you need to run this SQL in your Supabase SQL editor:
        </p>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`-- COURSES TABLE FIX
-- Add created_by column if missing
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create RLS policies for courses
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
CREATE POLICY "Authenticated users can create courses" 
ON courses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- COURSE SECTIONS TABLE FIX  
-- Create RLS policies for course_sections
DROP POLICY IF EXISTS "Solo creadores pueden gestionar secciones" ON course_sections;

CREATE POLICY "Creadores pueden insertar secciones" ON course_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = course_sections.course_id
            AND courses.created_by = auth.uid()
        )
    );

CREATE POLICY "Creadores pueden actualizar secciones" ON course_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = course_sections.course_id
            AND courses.created_by = auth.uid()
        )
    );`}</pre>
        <p className="text-sm text-yellow-700 mt-2">
          📋 <strong>Or copy the complete fix from:</strong> <code>scripts/06-fix-sections-rls.sql</code>
        </p>
      </div>
    </div>
  )
}
