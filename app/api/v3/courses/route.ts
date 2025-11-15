import { NextResponse } from 'next/server'
import { FirebaseCourseRepository } from '@infrastructure/firebase/firebase-course-repository'
import { ListActiveCoursesUseCase } from '@application/use-cases/list-active-courses'
import { CreateCourseUseCase } from '@application/use-cases/create-course'

export async function GET() {
  try {
    const repo = new FirebaseCourseRepository()
    const useCase = new ListActiveCoursesUseCase(repo)
    const courses = await useCase.execute(100)
    return NextResponse.json({ data: courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      difficulty: c.difficultyLevel,
      isActive: c.isActive,
      createdAt: c.createdAt,
    })) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const repo = new FirebaseCourseRepository()
    const useCase = new CreateCourseUseCase(repo)
    const course = await useCase.execute({
      title: body.title,
      description: body.description,
      category: body.category,
      difficultyLevel: body.difficultyLevel,
      estimatedDuration: body.estimatedDuration,
      createdBy: body.createdBy || null,
    })
    return NextResponse.json({
      id: course.id,
      title: course.title,
      category: course.category,
      difficulty: course.difficultyLevel,
      createdAt: course.createdAt,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
