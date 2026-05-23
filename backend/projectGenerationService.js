/**
 * AI Agent Project Studio - Project Generation Service
 *
 * This service simulates agent execution to generate complete project blueprints
 * based on user input and selected agents. It creates structured JSON outputs
 * that can be stored locally and downloaded as JSON or ZIP files.
 *
 * ZIP Export: Uses JSZip library for client-side ZIP generation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECTS_STORAGE_KEY = 'ai_agent_studio_projects';
const DEFAULT_ERROR_MESSAGE = 'We were unable to generate your project blueprint at this time. Please try again or adjust your project description.';
const ZIP_EXPORT_ERROR_MESSAGE = 'We were unable to export your project. Please try again.';

// ============================================================================
// AGENT EXECUTION SIMULATORS
// ============================================================================

/**
 * Simulate Database Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} Database layer definition
 */
function executeDatabaseAgent(projectDescription) {
  const lowerDesc = projectDescription.toLowerCase();
  
  // Infer database requirements
  const needsRelational = lowerDesc.includes('user') || lowerDesc.includes('product') || lowerDesc.includes('order');
  const needsNoSQL = lowerDesc.includes('real-time') || lowerDesc.includes('chat') || lowerDesc.includes('social');
  
  const tables = [];
  
  // Generate table schemas based on keywords
  if (lowerDesc.includes('user') || lowerDesc.includes('account') || lowerDesc.includes('login')) {
    tables.push({
      name: 'users',
      fields: [
        { name: 'id', type: 'UUID', primaryKey: true },
        { name: 'email', type: 'VARCHAR(255)', unique: true },
        { name: 'password_hash', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' }
      ]
    });
  }
  
  if (lowerDesc.includes('product') || lowerDesc.includes('item') || lowerDesc.includes('catalog')) {
    tables.push({
      name: 'products',
      fields: [
        { name: 'id', type: 'UUID', primaryKey: true },
        { name: 'name', type: 'VARCHAR(255)' },
        { name: 'description', type: 'TEXT' },
        { name: 'price', type: 'DECIMAL(10,2)' },
        { name: 'stock', type: 'INTEGER' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    });
  }
  
  if (lowerDesc.includes('order') || lowerDesc.includes('purchase') || lowerDesc.includes('transaction')) {
    tables.push({
      name: 'orders',
      fields: [
        { name: 'id', type: 'UUID', primaryKey: true },
        { name: 'user_id', type: 'UUID', foreignKey: 'users.id' },
        { name: 'total_amount', type: 'DECIMAL(10,2)' },
        { name: 'status', type: 'VARCHAR(50)' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    });
  }
  
  return {
    agentName: 'Database Agent',
    databaseType: needsNoSQL ? 'NoSQL (MongoDB)' : 'Relational (PostgreSQL)',
    schemas: tables.length > 0 ? tables : [
      {
        name: 'main_data',
        fields: [
          { name: 'id', type: 'UUID', primaryKey: true },
          { name: 'data', type: 'JSONB' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ]
      }
    ],
    indexing: ['Primary keys on all tables', 'Index on frequently queried fields'],
    backupStrategy: 'Daily automated backups with 30-day retention',
    securityMeasures: ['Encrypted connections', 'Row-level security', 'Audit logging']
  };
}

/**
 * Simulate User Interface Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} UI structure definition
 */
function executeUIAgent(projectDescription) {
  const lowerDesc = projectDescription.toLowerCase();
  
  const pages = [];
  const components = [];
  
  // Infer pages based on keywords
  if (lowerDesc.includes('login') || lowerDesc.includes('auth') || lowerDesc.includes('user')) {
    pages.push({ name: 'Login Page', route: '/login', purpose: 'User authentication' });
    pages.push({ name: 'Dashboard', route: '/dashboard', purpose: 'Main user interface' });
    components.push('LoginForm', 'AuthGuard', 'UserProfile');
  }
  
  if (lowerDesc.includes('product') || lowerDesc.includes('catalog') || lowerDesc.includes('shop')) {
    pages.push({ name: 'Product Catalog', route: '/products', purpose: 'Browse products' });
    pages.push({ name: 'Product Detail', route: '/products/:id', purpose: 'View product details' });
    components.push('ProductCard', 'ProductGrid', 'ProductFilter');
  }
  
  if (lowerDesc.includes('cart') || lowerDesc.includes('checkout') || lowerDesc.includes('order')) {
    pages.push({ name: 'Shopping Cart', route: '/cart', purpose: 'Review items' });
    pages.push({ name: 'Checkout', route: '/checkout', purpose: 'Complete purchase' });
    components.push('CartItem', 'CheckoutForm', 'PaymentMethod');
  }
  
  if (lowerDesc.includes('admin') || lowerDesc.includes('manage')) {
    pages.push({ name: 'Admin Panel', route: '/admin', purpose: 'System management' });
    components.push('AdminTable', 'AdminForm', 'AdminStats');
  }
  
  // Default pages if none detected
  if (pages.length === 0) {
    pages.push({ name: 'Home Page', route: '/', purpose: 'Landing page' });
    pages.push({ name: 'About Page', route: '/about', purpose: 'Information page' });
  }
  
  return {
    agentName: 'User Interface Agent',
    framework: 'React.js',
    pages: pages,
    components: components.length > 0 ? components : ['Header', 'Footer', 'Navigation', 'Card', 'Button'],
    styling: 'Tailwind CSS with custom design system',
    responsiveness: 'Mobile-first responsive design',
    accessibility: ['ARIA labels', 'Keyboard navigation', 'Screen reader support'],
    stateManagement: 'React Context API with hooks'
  };
}

/**
 * Simulate Logic Flow Agent execution
 * @param {string} projectDescription - User's project description
 * @param {Array} selectedAgents - List of selected agent names
 * @returns {Object} Workflow definition
 */
function executeLogicFlowAgent(projectDescription, selectedAgents) {
  const lowerDesc = projectDescription.toLowerCase();
  const workflow = [];
  
  // Build workflow based on selected agents
  if (selectedAgents.includes('Database Agent')) {
    workflow.push({
      step: 1,
      phase: 'Data Layer Setup',
      tasks: [
        'Design database schema',
        'Set up database connections',
        'Create migration scripts',
        'Implement data models'
      ],
      duration: '2-3 days'
    });
  }
  
  if (selectedAgents.includes('User Interface Agent')) {
    workflow.push({
      step: workflow.length + 1,
      phase: 'Frontend Development',
      tasks: [
        'Create component structure',
        'Implement page layouts',
        'Add styling and themes',
        'Ensure responsive design'
      ],
      duration: '3-4 days'
    });
  }
  
  workflow.push({
    step: workflow.length + 1,
    phase: 'Business Logic Implementation',
    tasks: [
      'Define core business rules',
      'Implement validation logic',
      'Create service layer',
      'Add error handling'
    ],
    duration: '2-3 days'
  });
  
  if (selectedAgents.includes('External API Agent')) {
    workflow.push({
      step: workflow.length + 1,
      phase: 'API Integration',
      tasks: [
        'Set up API clients',
        'Implement authentication',
        'Create data transformation layer',
        'Add retry and error handling'
      ],
      duration: '2 days'
    });
  }
  
  if (selectedAgents.includes('Chatbot Agent')) {
    workflow.push({
      step: workflow.length + 1,
      phase: 'Chatbot Integration',
      tasks: [
        'Design conversation flows',
        'Implement NLU processing',
        'Create response templates',
        'Test conversation scenarios'
      ],
      duration: '2-3 days'
    });
  }
  
  if (selectedAgents.includes('Analytics Agent')) {
    workflow.push({
      step: workflow.length + 1,
      phase: 'Analytics Setup',
      tasks: [
        'Define tracking events',
        'Implement analytics SDK',
        'Create dashboards',
        'Set up reporting'
      ],
      duration: '1-2 days'
    });
  }
  
  workflow.push({
    step: workflow.length + 1,
    phase: 'Testing & Deployment',
    tasks: [
      'Write unit tests',
      'Perform integration testing',
      'Set up CI/CD pipeline',
      'Deploy to production'
    ],
    duration: '2-3 days'
  });
  
  return {
    agentName: 'Logic Flow Agent',
    workflow: workflow,
    totalEstimatedDuration: `${workflow.length * 2}-${workflow.length * 3} days`,
    orchestrationPattern: 'Sequential with parallel sub-tasks',
    errorHandling: 'Centralized error handling with logging and user notifications',
    stateManagement: 'Redux for complex state, Context API for simple state'
  };
}

/**
 * Simulate Chatbot Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} Chatbot configuration
 */
function executeChatbotAgent(projectDescription) {
  const lowerDesc = projectDescription.toLowerCase();
  
  const intents = ['greeting', 'help', 'faq'];
  const flows = [];
  
  if (lowerDesc.includes('support') || lowerDesc.includes('help')) {
    intents.push('technical_support', 'troubleshooting');
    flows.push({
      name: 'Support Flow',
      trigger: 'User asks for help',
      steps: ['Identify issue', 'Provide solution', 'Escalate if needed']
    });
  }
  
  if (lowerDesc.includes('order') || lowerDesc.includes('track')) {
    intents.push('order_status', 'track_order');
    flows.push({
      name: 'Order Tracking',
      trigger: 'User wants to track order',
      steps: ['Request order ID', 'Fetch order status', 'Display tracking info']
    });
  }
  
  return {
    agentName: 'Chatbot Agent',
    platform: 'Custom chatbot with NLU',
    intents: intents,
    conversationFlows: flows.length > 0 ? flows : [
      {
        name: 'General FAQ',
        trigger: 'User asks common questions',
        steps: ['Understand question', 'Retrieve answer', 'Provide response']
      }
    ],
    nlpEngine: 'Intent classification with entity extraction',
    fallbackStrategy: 'Escalate to human agent after 2 failed attempts',
    languages: ['English']
  };
}

/**
 * Simulate E-commerce Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} E-commerce configuration
 */
function executeEcommerceAgent(projectDescription) {
  return {
    agentName: 'E-commerce Agent',
    features: [
      'Product catalog management',
      'Shopping cart functionality',
      'Checkout process',
      'Order management',
      'Inventory tracking'
    ],
    paymentGateways: ['Stripe', 'PayPal'],
    shippingIntegration: 'Third-party shipping API',
    taxCalculation: 'Automated tax calculation based on location',
    orderWorkflow: [
      'Add to cart',
      'Review cart',
      'Enter shipping info',
      'Select payment method',
      'Confirm order',
      'Process payment',
      'Send confirmation'
    ]
  };
}

/**
 * Simulate Analytics Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} Analytics configuration
 */
function executeAnalyticsAgent(projectDescription) {
  const lowerDesc = projectDescription.toLowerCase();
  
  const metrics = ['Page views', 'User sessions', 'Bounce rate'];
  
  if (lowerDesc.includes('ecommerce') || lowerDesc.includes('shop')) {
    metrics.push('Conversion rate', 'Average order value', 'Cart abandonment rate');
  }
  
  if (lowerDesc.includes('user') || lowerDesc.includes('engagement')) {
    metrics.push('User retention', 'Active users', 'Feature usage');
  }
  
  return {
    agentName: 'Analytics Agent',
    trackingEvents: metrics,
    dashboards: [
      { name: 'Overview Dashboard', metrics: ['Total users', 'Active sessions', 'Key metrics'] },
      { name: 'User Behavior', metrics: ['User flow', 'Feature adoption', 'Drop-off points'] }
    ],
    reportingFrequency: 'Daily automated reports',
    dataRetention: '90 days of detailed data, 2 years of aggregated data',
    privacyCompliance: 'GDPR and CCPA compliant tracking'
  };
}

/**
 * Simulate External API Agent execution
 * @param {string} projectDescription - User's project description
 * @returns {Object} API integration plan
 */
function executeExternalAPIAgent(projectDescription) {
  const lowerDesc = projectDescription.toLowerCase();
  
  const integrations = [];
  
  if (lowerDesc.includes('payment') || lowerDesc.includes('checkout')) {
    integrations.push({
      service: 'Payment Gateway (Stripe)',
      purpose: 'Process payments',
      endpoints: ['/create-payment-intent', '/confirm-payment']
    });
  }
  
  if (lowerDesc.includes('email') || lowerDesc.includes('notification')) {
    integrations.push({
      service: 'Email Service (SendGrid)',
      purpose: 'Send transactional emails',
      endpoints: ['/send-email', '/get-email-status']
    });
  }
  
  if (lowerDesc.includes('map') || lowerDesc.includes('location')) {
    integrations.push({
      service: 'Maps API (Google Maps)',
      purpose: 'Location services',
      endpoints: ['/geocode', '/directions']
    });
  }
  
  if (integrations.length === 0) {
    integrations.push({
      service: 'Generic REST API',
      purpose: 'External data integration',
      endpoints: ['/api/data', '/api/sync']
    });
  }
  
  return {
    agentName: 'External API Agent',
    integrations: integrations,
    authenticationMethod: 'OAuth 2.0 / API Keys',
    rateLimiting: 'Implement exponential backoff',
    errorHandling: 'Retry failed requests with circuit breaker pattern',
    caching: 'Cache responses for 5 minutes to reduce API calls'
  };
}

// ============================================================================
// PROJECT GENERATION
// ============================================================================

/**
 * Generate a complete project blueprint
 * @param {Object} params - Generation parameters
 * @param {string} params.projectName - Name of the project
 * @param {string} params.projectDescription - User's project description
 * @param {Array} params.selectedAgents - Array of selected agent names
 * @returns {Object} Complete project blueprint
 */
function generateProjectBlueprint(params) {
  try {
    const { projectName, projectDescription, selectedAgents } = params;
    
    // Validation
    if (!projectName || !projectDescription || !selectedAgents || selectedAgents.length === 0) {
      throw new Error('Missing required parameters for project generation');
    }
    
    const blueprint = {
      projectInfo: {
        name: projectName,
        description: projectDescription,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      },
      selectedAgents: selectedAgents,
      generatedComponents: {}
    };
    
    // Execute each selected agent
    selectedAgents.forEach(agentName => {
      switch (agentName) {
        case 'Database Agent':
          blueprint.generatedComponents.dataLayer = executeDatabaseAgent(projectDescription);
          break;
        case 'User Interface Agent':
          blueprint.generatedComponents.uiStructure = executeUIAgent(projectDescription);
          break;
        case 'Logic Flow Agent':
          blueprint.generatedComponents.workflow = executeLogicFlowAgent(projectDescription, selectedAgents);
          break;
        case 'Chatbot Agent':
          blueprint.generatedComponents.chatbot = executeChatbotAgent(projectDescription);
          break;
        case 'E-commerce Agent':
          blueprint.generatedComponents.ecommerce = executeEcommerceAgent(projectDescription);
          break;
        case 'Analytics Agent':
          blueprint.generatedComponents.analytics = executeAnalyticsAgent(projectDescription);
          break;
        case 'External API Agent':
          blueprint.generatedComponents.apiIntegration = executeExternalAPIAgent(projectDescription);
          break;
      }
    });
    
    // Add project summary
    blueprint.summary = {
      totalAgents: selectedAgents.length,
      estimatedComplexity: selectedAgents.length <= 3 ? 'Low' : selectedAgents.length <= 5 ? 'Medium' : 'High',
      recommendedTeamSize: Math.ceil(selectedAgents.length / 2),
      estimatedDuration: blueprint.generatedComponents.workflow ? 
        blueprint.generatedComponents.workflow.totalEstimatedDuration : 
        '2-4 weeks'
    };
    
    return blueprint;
  } catch (error) {
    console.error('Error generating project blueprint:', error);
    throw error;
  }
}

// ============================================================================
// PROJECT STORAGE
// ============================================================================

/**
 * Save project to localStorage
 * @param {Object} project - Project blueprint to save
 * @returns {string} Project ID
 */
function saveProject(project) {
  try {
    const projects = getStoredProjects();
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const projectWithId = {
      id: projectId,
      ...project,
      savedAt: new Date().toISOString()
    };
    
    projects.push(projectWithId);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    
    console.log('Project saved:', projectId);
    return projectId;
  } catch (error) {
    console.error('Error saving project:', error);
    throw new Error('Failed to save project to storage');
  }
}

/**
 * Get all stored projects
 * @returns {Array} Array of project objects
 */
function getStoredProjects() {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading projects from storage:', error);
    return [];
  }
}

/**
 * Get project by ID
 * @param {string} projectId - Project ID
 * @returns {Object|null} Project object or null
 */
function getProjectById(projectId) {
  try {
    const projects = getStoredProjects();
    return projects.find(p => p.id === projectId) || null;
  } catch (error) {
    console.error('Error getting project by ID:', error);
    return null;
  }
}

/**
 * Delete project by ID
 * @param {string} projectId - Project ID
 * @returns {boolean} True if deleted
 */
function deleteProject(projectId) {
  try {
    const projects = getStoredProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    
    if (filtered.length === projects.length) {
      return false; // Project not found
    }
    
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
    console.log('Project deleted:', projectId);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ============================================================================
// PROJECT DOWNLOAD
// ============================================================================

/**
 * Download project as JSON file
 * @param {Object} project - Project blueprint
 * @param {string} filename - Optional custom filename
 */
function downloadProject(project, filename) {
  try {
    const projectName = project.projectInfo?.name || 'project';
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
    
    const finalFilename = filename || defaultFilename;
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Project downloaded:', finalFilename);
  } catch (error) {
    console.error('Error downloading project:', error);
    throw new Error('Failed to download project file');
  }
}

// ============================================================================
// EXPORT FOR BROWSER USE
// ============================================================================

if (typeof window !== 'undefined') {
  window.ProjectGenerationService = {
    generateProjectBlueprint,
    saveProject,
    getStoredProjects,
    getProjectById,
    deleteProject,
    downloadProject,
    DEFAULT_ERROR_MESSAGE
  };
}

// For Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateProjectBlueprint,
    saveProject,
    getStoredProjects,
    getProjectById,
    deleteProject,
    downloadProject,
    DEFAULT_ERROR_MESSAGE
  };
}

// Made with Bob


// ============================================================================
// PROJECT FILE GENERATORS
// ============================================================================

/**
 * Generate README.md content for the project
 * @param {Object} project - Project blueprint
 * @returns {string} Markdown content
 */
function generateReadmeContent(project) {
  const info = project.projectInfo;
  const summary = project.summary;
  
  let readme = `# ${info.name}\n\n`;
  readme += `## Project Description\n\n${info.description}\n\n`;
  readme += `## Project Overview\n\n`;
  readme += `- **Created:** ${new Date(info.createdAt).toLocaleDateString()}\n`;
  readme += `- **Version:** ${info.version}\n`;
  readme += `- **Complexity:** ${summary.estimatedComplexity}\n`;
  readme += `- **Recommended Team Size:** ${summary.recommendedTeamSize} developers\n`;
  readme += `- **Estimated Duration:** ${summary.estimatedDuration}\n\n`;
  
  readme += `## Selected Agents\n\n`;
  readme += `This project uses ${project.selectedAgents.length} AI agents:\n\n`;
  project.selectedAgents.forEach((agent, idx) => {
    readme += `${idx + 1}. **${agent}**\n`;
  });
  readme += `\n`;
  
  // Add component sections
  if (project.generatedComponents.dataLayer) {
    readme += `## Data Layer\n\n`;
    readme += `- **Database Type:** ${project.generatedComponents.dataLayer.databaseType}\n`;
    readme += `- **Tables/Collections:** ${project.generatedComponents.dataLayer.schemas.length}\n\n`;
  }
  
  if (project.generatedComponents.uiStructure) {
    readme += `## User Interface\n\n`;
    readme += `- **Framework:** ${project.generatedComponents.uiStructure.framework}\n`;
    readme += `- **Pages:** ${project.generatedComponents.uiStructure.pages.length}\n`;
    readme += `- **Components:** ${project.generatedComponents.uiStructure.components.length}\n\n`;
  }
  
  if (project.generatedComponents.workflow) {
    readme += `## Development Workflow\n\n`;
    readme += `The project follows a ${project.generatedComponents.workflow.workflow.length}-phase development approach:\n\n`;
    project.generatedComponents.workflow.workflow.forEach((phase, idx) => {
      readme += `### Phase ${phase.step}: ${phase.phase}\n\n`;
      readme += `**Duration:** ${phase.duration}\n\n`;
      readme += `**Tasks:**\n`;
      phase.tasks.forEach(task => {
        readme += `- ${task}\n`;
      });
      readme += `\n`;
    });
  }
  
  readme += `## Getting Started\n\n`;
  readme += `This project blueprint was generated by the AI Agent Project Studio.\n`;
  readme += `Review the included JSON files for detailed specifications.\n\n`;
  
  readme += `## Files Included\n\n`;
  readme += `- \`project.json\` - Complete project blueprint\n`;
  readme += `- \`agents.json\` - Selected agents and their roles\n`;
  readme += `- \`workflow.json\` - Development workflow steps\n`;
  
  if (project.generatedComponents.dataLayer) {
    readme += `- \`database-schema.json\` - Database structure\n`;
  }
  if (project.generatedComponents.uiStructure) {
    readme += `- \`ui-spec.json\` - UI structure and components\n`;
  }
  if (project.generatedComponents.apiIntegration) {
    readme += `- \`api-spec.json\` - API integration plan\n`;
  }
  if (project.generatedComponents.analytics) {
    readme += `- \`analytics-plan.json\` - Analytics configuration\n`;
  }
  
  readme += `\n---\n\n`;
  readme += `Generated by AI Agent Project Studio - IBM Consulting Bob-a-thon 2026\n`;
  
  return readme;
}

/**
 * Generate agents.json content
 * @param {Object} project - Project blueprint
 * @returns {Object} Agents data
 */
function generateAgentsData(project) {
  return {
    projectName: project.projectInfo.name,
    totalAgents: project.selectedAgents.length,
    agents: project.selectedAgents.map(agentName => {
      // Get agent details from the service if available
      let agentDetails = null;
      try {
        if (typeof window !== 'undefined' && window.AgentService) {
          agentDetails = window.AgentService.getAgentByName(agentName);
        }
      } catch (e) {
        console.warn('Could not fetch agent details:', e);
      }
      
      return {
        name: agentName,
        type: agentDetails?.type || 'Agent',
        description: agentDetails?.description || `${agentName} for the project`,
        skills: agentDetails?.skills || ['Project-specific capabilities']
      };
    })
  };
}

/**
 * Generate workflow.json content
 * @param {Object} project - Project blueprint
 * @returns {Object} Workflow data
 */
function generateWorkflowData(project) {
  if (!project.generatedComponents.workflow) {
    return {
      projectName: project.projectInfo.name,
      workflow: [],
      note: 'No workflow generated - Logic Flow Agent not selected'
    };
  }
  
  return {
    projectName: project.projectInfo.name,
    totalPhases: project.generatedComponents.workflow.workflow.length,
    estimatedDuration: project.generatedComponents.workflow.totalEstimatedDuration,
    orchestrationPattern: project.generatedComponents.workflow.orchestrationPattern,
    workflow: project.generatedComponents.workflow.workflow
  };
}

// ============================================================================
// ZIP EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Check if JSZip library is available
 * @returns {boolean}
 */
function isJSZipAvailable() {
  return typeof JSZip !== 'undefined';
}

/**
 * Export project as ZIP file
 * @param {Object} project - Project blueprint
 * @param {string} filename - Optional custom filename (without .zip extension)
 * @returns {Promise<void>}
 */
async function exportProjectAsZip(project, filename) {
  try {
    console.log('=== ZIP Export Started ===');
    console.log('Project data:', project);
    
    // Check if JSZip is available
    if (!isJSZipAvailable()) {
      console.error('JSZip not available');
      throw new Error('JSZip library is not loaded. Please include JSZip in your HTML.');
    }
    console.log('✓ JSZip is available');
    
    // Validate project
    if (!project || !project.projectInfo) {
      console.error('Invalid project data:', project);
      throw new Error('Invalid project data');
    }
    console.log('✓ Project data is valid');
    
    console.log('Starting ZIP export for project:', project.projectInfo.name);
    
    // Initialize ZIP
    const zip = new JSZip();
    console.log('✓ ZIP initialized');
    
    // Generate filename
    const projectName = project.projectInfo.name || 'project';
    const timestamp = new Date().toISOString().split('T')[0];
    const zipFilename = filename || `${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.zip`;
    console.log('✓ Filename generated:', zipFilename);
    
    // Add project.json (complete blueprint)
    console.log('Adding project.json...');
    zip.file('project.json', JSON.stringify(project, null, 2));
    
    // Add README.md
    console.log('Generating README.md...');
    const readmeContent = generateReadmeContent(project);
    zip.file('README.md', readmeContent);
    console.log('✓ README.md added');
    
    // Add agents.json
    console.log('Generating agents.json...');
    const agentsData = generateAgentsData(project);
    zip.file('agents.json', JSON.stringify(agentsData, null, 2));
    console.log('✓ agents.json added');
    
    // Add workflow.json
    console.log('Generating workflow.json...');
    const workflowData = generateWorkflowData(project);
    zip.file('workflow.json', JSON.stringify(workflowData, null, 2));
    console.log('✓ workflow.json added');
    
    // Add optional component files
    if (project.generatedComponents.dataLayer) {
      zip.file('database-schema.json', JSON.stringify(project.generatedComponents.dataLayer, null, 2));
    }
    
    if (project.generatedComponents.uiStructure) {
      zip.file('ui-spec.json', JSON.stringify(project.generatedComponents.uiStructure, null, 2));
    }
    
    if (project.generatedComponents.apiIntegration) {
      zip.file('api-spec.json', JSON.stringify(project.generatedComponents.apiIntegration, null, 2));
    }
    
    if (project.generatedComponents.analytics) {
      zip.file('analytics-plan.json', JSON.stringify(project.generatedComponents.analytics, null, 2));
    }
    
    if (project.generatedComponents.chatbot) {
      zip.file('chatbot-config.json', JSON.stringify(project.generatedComponents.chatbot, null, 2));
    }
    
    if (project.generatedComponents.ecommerce) {
      zip.file('ecommerce-config.json', JSON.stringify(project.generatedComponents.ecommerce, null, 2));
    }
    
    console.log('Generating ZIP blob...');
    
    // Generate ZIP blob
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    console.log('ZIP blob generated, size:', blob.size, 'bytes');
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('ZIP export completed:', zipFilename);
    
  } catch (error) {
    console.error('Error exporting project as ZIP:', error);
    throw new Error(ZIP_EXPORT_ERROR_MESSAGE);

// Add missing closing brace for the function
  }

// ============================================================================
// EXPORT FOR BROWSER USE
// ============================================================================

if (typeof window !== 'undefined') {
  window.ProjectGenerationService = {
    generateProjectBlueprint,
    saveProject,
    getStoredProjects,
    getProjectById,
    deleteProject,
    downloadProject,
    exportProjectAsZip,
    isJSZipAvailable,
    DEFAULT_ERROR_MESSAGE,
    ZIP_EXPORT_ERROR_MESSAGE
  };
}

// For Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateProjectBlueprint,
    saveProject,
    getStoredProjects,
    getProjectById,
    deleteProject,
    downloadProject,
    exportProjectAsZip,
    isJSZipAvailable,
    DEFAULT_ERROR_MESSAGE,
    ZIP_EXPORT_ERROR_MESSAGE
  };
}
}
