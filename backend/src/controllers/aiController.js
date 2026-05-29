const AIService = require('../services/aiService');

/**
 * AI Controller
 * Handles AI-powered features and insights
 * Note: AIService already uses dynamodbService internally
 */

class AIController {
  /**
   * Get restocking suggestions
   */
  static async getRestockingSuggestions(req, res) {
    try {
      const suggestions = await AIService.getRestockingSuggestions();
      
      res.json({
        success: true,
        count: suggestions.length,
        data: suggestions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get stock redistribution suggestions
   */
  static async getRedistributionSuggestions(req, res) {
    try {
      const suggestions = await AIService.getRedistributionSuggestions();
      
      res.json({
        success: true,
        count: suggestions.length,
        data: suggestions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get comprehensive insights dashboard
   */
  static async getInsights(req, res) {
    try {
      const insights = await AIService.getInsights();
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * AI Assistant - Natural language query
   */
  static async askAssistant(req, res) {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }
      
      const response = await AIService.askAssistant(query);
      
      res.json({
        success: true,
        query,
        ...response
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AIController;
