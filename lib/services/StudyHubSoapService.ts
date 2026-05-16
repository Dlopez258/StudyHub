import { SupabaseClient } from '@supabase/supabase-js';
import { CategoryModel } from '@/lib/models/CategoryModel';
import { SessionModel } from '@/lib/models/SessionModel';

interface GetCategoriesArgs {
  userId: string;
}

interface GetTaskStatsArgs {
  userId: string;
}

interface GetStudyStatsArgs {
  userId: string;
}

/**
 * Implementación de las operaciones SOAP de StudyHub.
 * Cada método recibe los argumentos del envelope SOAP y devuelve
 * la estructura que node-soap serializa de vuelta como respuesta XML.
 */
export class StudyHubSoapService {
  constructor(private readonly supabase: SupabaseClient) {}

  async GetCategories({ userId }: GetCategoriesArgs) {
    if (!userId) throw new Error('userId es obligatorio');
    const model = new CategoryModel(this.supabase);
    const list = await model.findAllByUser(userId);
    return {
      categories: {
        category: list.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          created_at: c.created_at,
        })),
      },
    };
  }

  async GetTaskStats({ userId }: GetTaskStatsArgs) {
    if (!userId) throw new Error('userId es obligatorio');

    const { data } = await this.supabase
      .from('tasks')
      .select('quadrant, completed')
      .eq('user_id', userId);

    const tasks = data ?? [];
    const count = (q: string) => tasks.filter((t) => t.quadrant === q).length;

    return {
      stats: {
        urgentImportant: count('urgent_important'),
        notUrgentImportant: count('not_urgent_important'),
        urgentNotImportant: count('urgent_not_important'),
        notUrgentNotImportant: count('not_urgent_not_important'),
        totalCompleted: tasks.filter((t) => t.completed).length,
        totalPending: tasks.filter((t) => !t.completed).length,
      },
    };
  }

  async GetStudyStats({ userId }: GetStudyStatsArgs) {
    if (!userId) throw new Error('userId es obligatorio');
    const model = new SessionModel(this.supabase);
    const stats = await model.getStats(userId);
    return {
      stats: {
        totalMinutesThisWeek: stats.totalMinutesThisWeek,
        currentStreak: stats.currentStreak,
        topCategoryThisMonth: stats.topCategoryThisMonth ?? '',
        dailyAverage: stats.dailyAverage,
      },
    };
  }
}

/** Objeto de servicio con la forma que espera node-soap (service → port → operation) */
export function buildSoapServiceObject(supabase: SupabaseClient) {
  const impl = new StudyHubSoapService(supabase);
  return {
    StudyHubService: {
      StudyHubPort: {
        GetCategories: (args: GetCategoriesArgs) => impl.GetCategories(args),
        GetTaskStats: (args: GetTaskStatsArgs) => impl.GetTaskStats(args),
        GetStudyStats: (args: GetStudyStatsArgs) => impl.GetStudyStats(args),
      },
    },
  };
}
