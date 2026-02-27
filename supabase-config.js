// ============================================================================
// SUPABASE CONFIGURATION - FIXED VERSION
// ============================================================================

const SUPABASE_CONFIG = {
  url: 'https://tvhuoegglhkisservgmu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aHVvZWdnbGhraXNzZXJ2Z211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzY3NzIsImV4cCI6MjA4NzU1Mjc3Mn0._qp__qNjoXBY1JItn3MW708RHXtdgCZB6PegZUtDzyY' // The long eyJhbG'
};

// Initialize Supabase client
let supabaseClient;
try {
  supabaseClient = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
  console.log('✅ Supabase client initialized and ready!');
} catch (error) {
  console.error('❌ Failed to initialize Supabase:', error);
}

// ============================================================================
// DATABASE HELPER FUNCTIONS
// ============================================================================

const db = {
  // GET COMPETENCIES
  async getCompetencies() {
    try {
      const { data, error } = await supabaseClient
        .from('competencies')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching competencies:', error);
      return [];
    }
  },

  // GET DIRECTORS
  async getDirectors(organizationId) {
    try {
      const { data, error } = await supabaseClient
        .from('directors')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching directors:', error);
      return [];
    }
  },

  // GET ALL DIRECTORS (no filter)
  async getAllDirectors() {
    try {
      const { data, error } = await supabaseClient
        .from('directors')
        .select(`
          *,
          organizations (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all directors:', error);
      return [];
    }
  },

  // GET ORGANIZATIONS
  async getOrganizations() {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  },

  // GET EVALUATION
  async getEvaluation(organizationId, year) {
    try {
      const { data, error } = await supabaseClient
        .from('evaluations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('year', year)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      return null;
    }
  },

  // CREATE ORGANIZATION
  async createOrganization(name, orgType, industry) {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .insert({
          name,
          org_type: orgType,
          industry
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  },

  // CREATE DIRECTOR
  async createDirector(organizationId, name, email) {
    try {
      const { data, error } = await supabaseClient
        .from('directors')
        .insert({
          organization_id: organizationId,
          name,
          email,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating director:', error);
      throw error;
    }
  },

  // COUNT RECORDS (for dashboard stats)
  async getCounts() {
    try {
      const [orgs, dirs, evals, comps] = await Promise.all([
        supabaseClient.from('organizations').select('id', { count: 'exact', head: true }),
        supabaseClient.from('directors').select('id', { count: 'exact', head: true }),
        supabaseClient.from('evaluations').select('id', { count: 'exact', head: true }),
        supabaseClient.from('competencies').select('id', { count: 'exact', head: true })
      ]);

      return {
        organizations: orgs.count || 0,
        directors: dirs.count || 0,
        evaluations: evals.count || 0,
        competencies: comps.count || 0
      };
    } catch (error) {
      console.error('Error fetching counts:', error);
      return {
        organizations: 0,
        directors: 0,
        evaluations: 0,
        competencies: 0
      };
    }
  }
};

// Make db available globally for console testing
window.db = db;
