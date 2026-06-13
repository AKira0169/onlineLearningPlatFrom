import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

/** Port of `src/traceStudent/traceStudentController.js` (submitAnswers). */
@Injectable()
export class TraceStudentService {
  constructor(
    @InjectModel('StudentQuiz') private readonly studentQuizModel: Model<any>,
    @InjectModel('Quiz') private readonly quizModel: Model<any>,
  ) {}

  async submitAnswers(quizId: string, body: SubmitAnswersDto, user: any) {
    const { answers } = body;

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const totalQuestions = quiz.questions.length;
    let correctAnswersCount = 0;

    const results = answers.map(answer => {
      const question = quiz.questions.find((q: any) => q._id.toString() === answer.questionId);
      if (!question) return undefined;
      const isCorrect = question.correctAnswer === answer.selectedOption;
      if (isCorrect) correctAnswersCount++;
      return { questionId: answer.questionId, selectedOption: answer.selectedOption, isCorrect };
    });

    const traceStudent = new this.studentQuizModel({
      student: user._id,
      quiz: quizId,
      answers: results,
      correctAnswersCount,
      totalQuestions,
    });
    await traceStudent.save();

    return {
      message: 'Quiz submitted successfully',
      totalQuestions,
      correctAnswersCount,
      results,
      traceStudent,
    };
  }
}
