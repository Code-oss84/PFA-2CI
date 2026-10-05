// ============================================
// Service LLM - Assistant pédagogique
// Utilise GROQ (rapide, gratuit) avec le modèle
// llama-3.1-70b-versatile pour générer les
// réponses pédagogiques de l'avatar
// ============================================

const fetch = require('node-fetch');

class LlmService {
  constructor() {
    this.groqURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.apiKey = process.env.GROQ_API_KEY;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async generateResponse(userMessage, history = [], avatarName = 'Professeur') {
    if (!this.isConfigured()) {
      return this.fallbackResponse(userMessage);
    }

    const systemPrompt = `Tu es ${avatarName}, un professeur passionné et chaleureux qui s'adresse à un élève en classe.
Tu parles TOUJOURS EN FRANÇAIS, même si le contenu de la leçon est dans une autre langue.
Parle comme un vrai prof qui explique à l'oral, NATURELLEMENT, comme une conversation :
- Utilise des mots simples et des EXEMPLES de la vie quotidienne (« imagine que... », « c'est comme si... »).
- Ajoute envie et enthousiasme, des petites phrases de réassurance (« tu vois ? », « c'est vraiment utile », « pas de panique »).
- Fais des liens et encourage l'élève, mais sans être trop long.
- Évite le ton robotique, les puces (•, *), les titres de sections, et toute structure trop "intelligence artificielle".
- Même si tu donnes 2-3 idées, enchaîne-les naturellement dans la phrase, façon explication orale.
IMPORTANT : reste CONCIS car ton discours sera LU À VOIX HAUTE.
- Explication de leçon : 3 à 4 phrases maximum.
- Réponse à une question : 2 à 3 phrases maximum.
- Ne développe surtout pas chaque exemple longuement : une phrase d'exemple suffit.
Pas d'introduction inutile (« Bonjour ! », « Excellente question ! ») ni de conclusion répétitive.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    try {
      const res = await fetch(this.groqURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages,
          temperature: 0.5,
          max_tokens: 300,
          top_p: 0.9
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Groq] Erreur API:', res.status, errorData);
        return this.fallbackResponse(userMessage);
      }

      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Groq] Erreur:', err.message);
      return this.fallbackResponse(userMessage);
    }
  }

  fallbackResponse(userMessage) {
    return `Bien reçu ! J'ai compris votre message : "${userMessage}". 
Le service de l'assistant est momentanément indisponible, mais je suis prêt à vous aider dès qu'il sera disponible.`;
  }
}

module.exports = new LlmService();