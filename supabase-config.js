// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
// Replace these values with your actual Supabase credentials
// Find them at: Settings → API in your Supabase dashboard


const SUPABASE_CONFIG = {
  url: 'https://tvhuoegglhkisservgmu.supabase.co',        // e.g., 'https://abc123.supabase.co'
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aHVvZWdnbGhraXNzZXJ2Z211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzY3NzIsImV4cCI6MjA4NzU1Mjc3Mn0._qp__qNjoXBY1JItn3MW708RHXtdgCZB6PegZUtDzyY' // The long eyJhbG... string
};

// ============================================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================================
// This creates a connection to your database
const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// ============================================================================
// HELPER FUNCTIONS - Easy database access
// ============================================================================

const db = {
  // GET COMPETENCIES
  async getCompetencies() {
    const { data, error } = await supabaseClient
      .from('competencies')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching competencies:', error);
      return [];
    }
    return data;
  },

  // GET DIRECTORS FOR AN ORGANIZATION
  async getDirectors(organizationId) {
    const { data, error } = await supabaseClient
      .from('directors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching directors:', error);
      return [];
    }
    return data;
  },

  // GET EVALUATION BY YEAR
  async getEvaluation(organizationId, year) {
    const { data, error } = await supabaseClient
      .from('evaluations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('year', year)
      .single();
    
    if (error) {
      console.error('Error fetching evaluation:', error);
      return null;
    }
    return data;
  },

  // CREATE NEW EVALUATION
  async createEvaluation(organizationId, year) {
    const { data, error } = await supabaseClient
      .from('evaluations')
      .insert({
        organization_id: organizationId,
        year: year,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating evaluation:', error);
      return null;
    }
    return data;
  },

  // ADD COMPETENCY TO EVALUATION
  async addCompetencyToEvaluation(evaluationId, organizationId, competencyId, levelOfNeed, evaluatedBy) {
    const { data, error } = await supabaseClient
      .from('organization_competencies')
      .insert({
        organization_id: organizationId,
        evaluation_id: evaluationId,
        competency_id: competencyId,
        level_of_need: levelOfNeed,
        evaluated_by: evaluatedBy
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding competency:', error);
      return null;
    }
    return data;
  },

  // GET SELECTED COMPETENCIES FOR AN EVALUATION
  async getEvaluationCompetencies(evaluationId) {
    const { data, error } = await supabaseClient
      .from('organization_competencies')
      .select(`
        *,
        competencies (*)
      `)
      .eq('evaluation_id', evaluationId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching evaluation competencies:', error);
      return [];
    }
    return data;
  },

  // SAVE SCORE
  async saveScore(evaluationId, directorId, competencyId, evaluatorId, score, isNA = false, isSelf = false) {
    const { data, error } = await supabaseClient
      .from('scores')
      .upsert({
        evaluation_id: evaluationId,
        director_id: directorId,
        competency_id: competencyId,
        evaluator_id: evaluatorId,
        score: isNA ? null : score,
        is_na: isNA,
        is_self_evaluation: isSelf
      }, {
        onConflict: 'evaluation_id,director_id,competency_id,evaluator_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving score:', error);
      return null;
    }
    return data;
  },

  // GET SCORES FOR A DIRECTOR
  async getDirectorScores(evaluationId, directorId) {
    const { data, error } = await supabaseClient
      .from('scores')
      .select(`
        *,
        competencies (*),
        evaluators (*)
      `)
      .eq('evaluation_id', evaluationId)
      .eq('director_id', directorId);
    
    if (error) {
      console.error('Error fetching director scores:', error);
      return [];
    }
    return data;
  },

  // GET ALL SCORES FOR AN EVALUATION (for board report)
  async getEvaluationScores(evaluationId) {
    const { data, error } = await supabaseClient
      .from('scores')
      .select(`
        *,
        directors (*),
        competencies (*),
        evaluators (*)
      `)
      .eq('evaluation_id', evaluationId);
    
    if (error) {
      console.error('Error fetching evaluation scores:', error);
      return [];
    }
    return data;
  },

  // GET AGGREGATE SCORES (uses the view we created)
  async getDirectorCompetencyScores(evaluationId) {
    const { data, error } = await supabaseClient
      .from('director_competency_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (error) {
      console.error('Error fetching aggregate scores:', error);
      return [];
    }
    return data;
  },

  // GET BOARD-WIDE AVERAGES (uses the view we created)
  async getBoardAverages(evaluationId) {
    const { data, error } = await supabaseClient
      .from('board_competency_averages')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (error) {
      console.error('Error fetching board averages:', error);
      return [];
    }
    return data;
  }
};

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

const auth = {
  // Sign in with email/password
  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return null;
    }
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Sign out error:', error);
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  // Check if user is logged in
  async isLoggedIn() {
    const user = await this.getCurrentUser();
    return user !== null;
  }
};

// ============================================================================
// DEMO/TESTING MODE
// ============================================================================
// For initial testing without authentication, we'll use a hardcoded org ID
// Once you have real authentication, this will come from the logged-in user

const DEMO_CONFIG = {
  organizationId: '00000000-0000-0000-0000-000000000001', // From sample data
  currentYear: 2026
};

// ============================================================================
// READY TO USE!
// ============================================================================
// Your HTML files can now use:
// - db.getCompetencies()
// - db.getDirectors(orgId)
// - db.saveScore(...)
// - etc.

console.log('✅ Supabase client initialized and ready!');
