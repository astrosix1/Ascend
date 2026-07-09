// Conversation Master — branching dialogue scenarios for building EQ

export type NPCEmotion = 'happy' | 'neutral' | 'sad' | 'angry' | 'worried' | 'surprised' | 'hurt' | 'satisfied' | 'defensive' | 'hopeful';
export type RelationshipImpact = 'damaged' | 'neutral' | 'improved' | 'strengthened';

export interface EndingData {
  relationshipImpact: RelationshipImpact;
  finalMessage: string;
  eqLesson: string;
  skillsUsed: string[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  relationshipDelta: number; // applied to 0–100 meter
  eqScore: number; // 0–10
}

export interface ConversationNode {
  id: string;
  npcMessage: string;
  npcEmotion: NPCEmotion;
  choices?: DialogueChoice[];
  isEnding?: boolean;
  endingData?: EndingData;
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  situation: string;
  context: string;
  npcName: string;
  npcAvatar: string;
  initialRelationship: number; // 0–100
  userGoal: string;
  startNodeId: string;
  nodes: { [nodeId: string]: ConversationNode };
  eqSkillsFocused: string[];
}

export const CONVERSATION_MASTER_SCENARIOS: Scenario[] = [
  // ─── SCENARIO 1: THE CONSTANT INTERRUPTER (Easy) ───────────────
  {
    id: 'scenario_interrupter',
    title: 'The Constant Interrupter',
    difficulty: 'easy',
    icon: '💬',
    situation: 'Your coworker Alex keeps cutting you off in meetings. It just happened again.',
    context: 'This is the third time this week. You need to say something — but you like Alex and don\'t want to make it awkward.',
    npcName: 'Alex',
    npcAvatar: '👤',
    initialRelationship: 55,
    userGoal: 'Address the interrupting behavior while keeping the relationship intact',
    startNodeId: 'start',
    eqSkillsFocused: ['assertiveness', 'boundary-setting', 'empathy', 'conflict-resolution'],
    nodes: {
      start: {
        id: 'start',
        npcMessage: "Hey! Good meeting right? I really liked where the project discussion was going.",
        npcEmotion: 'happy',
        choices: [
          { id: 'c1a', text: "Hey, actually — got a minute? I wanted to talk about something.", nextNodeId: 'bring_it_up', relationshipDelta: 0, eqScore: 8 },
          { id: 'c1b', text: "Yeah, good meeting. [You start walking away]", nextNodeId: 'avoid_end', relationshipDelta: -5, eqScore: 2 },
          { id: 'c1c', text: "You cut me off three times in there. Can you not do that?", nextNodeId: 'confronted', relationshipDelta: -10, eqScore: 3 },
        ],
      },
      bring_it_up: {
        id: 'bring_it_up',
        npcMessage: "Of course. Is everything okay? You look a little serious.",
        npcEmotion: 'worried',
        choices: [
          { id: 'c2a', text: "I'm good. I just wanted to mention — I've noticed that sometimes I get cut off when I'm speaking in meetings, before I can finish my thought.", nextNodeId: 'alex_realizes', relationshipDelta: 5, eqScore: 9 },
          { id: 'c2b', text: "It's been bothering me. You interrupted me multiple times today.", nextNodeId: 'alex_defensive', relationshipDelta: -5, eqScore: 4 },
          { id: 'c2c', text: "Nothing serious. Never mind, it's not a big deal.", nextNodeId: 'brushed_off_end', relationshipDelta: -3, eqScore: 2 },
        ],
      },
      alex_realizes: {
        id: 'alex_realizes',
        npcMessage: "Oh wow — I had no idea I was doing that. I get excited and I just jump in. I'm really sorry. Has it been happening a lot?",
        npcEmotion: 'surprised',
        choices: [
          { id: 'c3a', text: "Yeah, a few times this week. I don't think you mean it, and I appreciate you hearing me out.", nextNodeId: 'alex_grateful', relationshipDelta: 10, eqScore: 10 },
          { id: 'c3b', text: "It's happened before. I just wanted you to be aware.", nextNodeId: 'alex_reflective', relationshipDelta: 5, eqScore: 8 },
          { id: 'c3c', text: "Pretty much every meeting. It's been frustrating.", nextNodeId: 'alex_defensive', relationshipDelta: -5, eqScore: 4 },
        ],
      },
      alex_grateful: {
        id: 'alex_grateful',
        npcMessage: "Thank you for telling me instead of just stewing over it. That actually takes courage. I'll be conscious of it — and genuinely, call me out if I do it again.",
        npcEmotion: 'satisfied',
        choices: [
          { id: 'c4a', text: "I appreciate that. That's all I needed — just to clear the air.", nextNodeId: 'strong_end', relationshipDelta: 10, eqScore: 10 },
          { id: 'c4b', text: "Thanks. Let's just move forward.", nextNodeId: 'improved_end', relationshipDelta: 5, eqScore: 7 },
        ],
      },
      alex_reflective: {
        id: 'alex_reflective',
        npcMessage: "Got it. I hear you. I'll work on that — I know I can get carried away when I'm excited.",
        npcEmotion: 'neutral',
        choices: [
          { id: 'c4c', text: "That's all I ask. Thanks for listening.", nextNodeId: 'improved_end', relationshipDelta: 8, eqScore: 9 },
          { id: 'c4d', text: "Cool. [End of conversation]", nextNodeId: 'improved_end', relationshipDelta: 3, eqScore: 6 },
        ],
      },
      alex_defensive: {
        id: 'alex_defensive',
        npcMessage: "I... okay. I didn't realize it was that bad. I'm sorry. I wasn't trying to disrespect you.",
        npcEmotion: 'defensive',
        choices: [
          { id: 'c5a', text: "I know you weren't. I just needed you to know how it was landing.", nextNodeId: 'repair_end', relationshipDelta: 5, eqScore: 8 },
          { id: 'c5b', text: "Okay. Well, just be more careful.", nextNodeId: 'neutral_end', relationshipDelta: 0, eqScore: 5 },
        ],
      },
      confronted: {
        id: 'confronted',
        npcMessage: "Whoa — I was just adding to the conversation. I wasn't trying to cut you off.",
        npcEmotion: 'defensive',
        choices: [
          { id: 'c6a', text: "I know you didn't mean it that way. But it kept happening and it was hard to finish my thought.", nextNodeId: 'alex_defensive', relationshipDelta: 5, eqScore: 7 },
          { id: 'c6b', text: "Well it happened. Multiple times. Just be more careful.", nextNodeId: 'neutral_end', relationshipDelta: -5, eqScore: 3 },
          { id: 'c6c', text: "You know what, forget it. I'm overreacting.", nextNodeId: 'brushed_off_end', relationshipDelta: -8, eqScore: 2 },
        ],
      },
      strong_end: {
        id: 'strong_end',
        npcMessage: "Absolutely. You know, I'm glad we talked. We make a good team.",
        npcEmotion: 'happy',
        isEnding: true,
        endingData: {
          relationshipImpact: 'strengthened',
          finalMessage: "You addressed the issue with honesty and warmth. Alex felt respected, not attacked — and the relationship came out stronger for it.",
          eqLesson: "Naming a behavior pattern early — without blame — prevents resentment from building. Timing and tone turn a difficult topic into a connection moment.",
          skillsUsed: ['assertiveness', 'empathy', 'boundary-setting'],
        },
      },
      improved_end: {
        id: 'improved_end',
        npcMessage: "Yeah. Thanks for bringing it up. I'll do better.",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'improved',
          finalMessage: "You raised the issue and Alex heard you. The relationship is intact and the pattern is likely to shift.",
          eqLesson: "Even imperfect conversations move the needle. You showed up — that matters more than having the perfect words.",
          skillsUsed: ['assertiveness', 'conflict-resolution'],
        },
      },
      repair_end: {
        id: 'repair_end',
        npcMessage: "Fair enough. I'm sorry — I'll pay attention to it.",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'improved',
          finalMessage: "You redirected after a rough start. Bringing empathy into a charged moment shifted the dynamic.",
          eqLesson: "It's never too late to soften mid-conversation. One empathetic sentence can repair what a blunt one started.",
          skillsUsed: ['emotional-regulation', 'empathy'],
        },
      },
      neutral_end: {
        id: 'neutral_end',
        npcMessage: "Okay. [The conversation ends. Alex looks a little stung.]",
        npcEmotion: 'sad',
        isEnding: true,
        endingData: {
          relationshipImpact: 'neutral',
          finalMessage: "You said something, but it came out sharper than necessary. The issue was raised but so was some tension.",
          eqLesson: "You communicated your boundary, but the delivery created defensiveness. Softening tone usually gets you the same result — with less friction.",
          skillsUsed: ['assertiveness'],
        },
      },
      avoid_end: {
        id: 'avoid_end',
        npcMessage: "[You walk away. The same thing happens next meeting — and the one after. You start dreading speaking up in group settings.]",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'neutral',
          finalMessage: "The pattern continued because it was never addressed. Alex had no idea.",
          eqLesson: "Avoiding discomfort keeps patterns alive. Most people don't know they're doing something that bothers you — they can't fix what they don't know about.",
          skillsUsed: [],
        },
      },
      brushed_off_end: {
        id: 'brushed_off_end',
        npcMessage: "Oh okay. [Shrugs] Alright, well, catch you later.",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'neutral',
          finalMessage: "You pulled back and nothing changed. The resentment stayed inside.",
          eqLesson: "Minimizing your own feelings as 'not a big deal' teaches others they can do the same. Your needs are worth naming.",
          skillsUsed: [],
        },
      },
    },
  },

  // ─── SCENARIO 2: RECEIVING HARSH FEEDBACK (Medium) ─────────────
  {
    id: 'scenario_feedback',
    title: 'Receiving Harsh Feedback',
    difficulty: 'medium',
    icon: '📊',
    situation: 'Your manager Jordan pulls you aside after your presentation to give critical feedback.',
    context: 'It felt harsh and public. You\'re embarrassed and defensive. Staying open to criticism — even imperfect criticism — is harder than it sounds.',
    npcName: 'Jordan',
    npcAvatar: '👔',
    initialRelationship: 50,
    userGoal: 'Stay open to feedback without becoming defensive or shutting down',
    startNodeId: 'start',
    eqSkillsFocused: ['emotional-regulation', 'growth-mindset', 'openness', 'accountability'],
    nodes: {
      start: {
        id: 'start',
        npcMessage: "Hey, can I pull you aside for a second? I want to talk about your presentation from this morning.",
        npcEmotion: 'neutral',
        choices: [
          { id: 'c1a', text: "Of course. I was actually hoping to get your thoughts.", nextNodeId: 'open_start', relationshipDelta: 5, eqScore: 9 },
          { id: 'c1b', text: "Sure. [You feel your chest tighten, but follow them]", nextNodeId: 'tense_start', relationshipDelta: 0, eqScore: 6 },
          { id: 'c1c', text: "I mean... I thought it went pretty well.", nextNodeId: 'pre_defensive', relationshipDelta: -5, eqScore: 3 },
        ],
      },
      open_start: {
        id: 'open_start',
        npcMessage: "I appreciate that. Look — I'll be direct. The data visualization in the second half was hard to follow. Some of the team mentioned they lost the thread. I know you worked hard on this, but the next one needs to be sharper.",
        npcEmotion: 'neutral',
        choices: [
          { id: 'c2a', text: "Thanks for being direct. Can you point me to a specific slide? I want to understand exactly what wasn't landing.", nextNodeId: 'jordan_specific', relationshipDelta: 10, eqScore: 10 },
          { id: 'c2b', text: "Okay. What would you have done differently?", nextNodeId: 'jordan_mentor', relationshipDelta: 8, eqScore: 9 },
          { id: 'c2c', text: "I spent a lot of time on those visuals. The data is all there.", nextNodeId: 'jordan_frustrated', relationshipDelta: -8, eqScore: 3 },
        ],
      },
      tense_start: {
        id: 'tense_start',
        npcMessage: "The data visualization in the second half wasn't clear. People got confused, and I think it undermined the point you were making. Your presentations need to be cleaner.",
        npcEmotion: 'neutral',
        choices: [
          { id: 'c2d', text: "You're right. What specifically wasn't working?", nextNodeId: 'jordan_specific', relationshipDelta: 10, eqScore: 10 },
          { id: 'c2e', text: "I'll work on it. [You look down, feeling embarrassed]", nextNodeId: 'shut_down', relationshipDelta: -3, eqScore: 4 },
          { id: 'c2f', text: "The deadline was really tight. I didn't have time to polish it.", nextNodeId: 'jordan_frustrated', relationshipDelta: -5, eqScore: 3 },
        ],
      },
      pre_defensive: {
        id: 'pre_defensive',
        npcMessage: "I know you put in effort, but some of the team said the data was hard to follow. I want to make sure we address it before the next one.",
        npcEmotion: 'neutral',
        choices: [
          { id: 'c2g', text: "Okay, I hear you. Can you tell me specifically what they found confusing?", nextNodeId: 'jordan_specific', relationshipDelta: 10, eqScore: 9 },
          { id: 'c2h', text: "With respect — I don't think the issue was the data. Maybe the audience wasn't ready for that level of detail.", nextNodeId: 'jordan_done', relationshipDelta: -12, eqScore: 1 },
        ],
      },
      jordan_specific: {
        id: 'jordan_specific',
        npcMessage: "Yeah — slide 8. Three graphs overlapping. The trend lines were impossible to read separately. If you use one chart at a time with a short annotation, it'll land. You clearly know the data — just make it easy to receive.",
        npcEmotion: 'satisfied',
        choices: [
          { id: 'c3a', text: "That's really helpful. I'll rework slide 8 before it goes to the broader team.", nextNodeId: 'jordan_impressed', relationshipDelta: 10, eqScore: 10 },
          { id: 'c3b', text: "Got it. I'll simplify the visuals.", nextNodeId: 'jordan_satisfied', relationshipDelta: 5, eqScore: 8 },
        ],
      },
      jordan_mentor: {
        id: 'jordan_mentor',
        npcMessage: "Honestly? Less is more with data. Pick the one number that makes your case and build around it. You're trying to show everything — and that buries the story. What was your core point?",
        npcEmotion: 'happy',
        choices: [
          { id: 'c3c', text: "That Q2 retention improved 18% because of the onboarding changes.", nextNodeId: 'jordan_impressed', relationshipDelta: 10, eqScore: 10 },
          { id: 'c3d', text: "There were a lot of key metrics to cover...", nextNodeId: 'jordan_patient', relationshipDelta: 2, eqScore: 5 },
        ],
      },
      jordan_frustrated: {
        id: 'jordan_frustrated',
        npcMessage: "I understand you work under pressure. But so does everyone. The deliverable still has to be clear. I need you to take this seriously.",
        npcEmotion: 'angry',
        choices: [
          { id: 'c3e', text: "You're right. I'm sorry. What's the most important thing to fix first?", nextNodeId: 'jordan_satisfied', relationshipDelta: 8, eqScore: 8 },
          { id: 'c3f', text: "I do take it seriously. I think the expectations weren't realistic given the timeline.", nextNodeId: 'jordan_done', relationshipDelta: -10, eqScore: 2 },
        ],
      },
      shut_down: {
        id: 'shut_down',
        npcMessage: "Hey — are you okay? I'm not trying to come down hard on you. I want you to grow.",
        npcEmotion: 'worried',
        choices: [
          { id: 'c4a', text: "I know. It's hard to hear, but I appreciate it. What should I focus on first?", nextNodeId: 'jordan_mentor', relationshipDelta: 8, eqScore: 9 },
          { id: 'c4b', text: "[You nod but don't engage further]", nextNodeId: 'silent_end', relationshipDelta: -5, eqScore: 2 },
        ],
      },
      jordan_impressed: {
        id: 'jordan_impressed',
        npcMessage: "Exactly. Lead with that next time. I actually think your instincts are strong — I just want to see it in the delivery. Good talk.",
        npcEmotion: 'satisfied',
        isEnding: true,
        endingData: {
          relationshipImpact: 'strengthened',
          finalMessage: "You turned hard feedback into a genuine learning conversation. Jordan now sees you as coachable and sharp.",
          eqLesson: "Receiving feedback without defensiveness is one of the rarest professional skills. You didn't just survive this moment — you grew from it.",
          skillsUsed: ['emotional-regulation', 'growth-mindset', 'openness', 'accountability'],
        },
      },
      jordan_satisfied: {
        id: 'jordan_satisfied',
        npcMessage: "Good. I know it's not easy to hear. You've got the right instincts — just work on the execution.",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'improved',
          finalMessage: "You navigated the feedback professionally. You didn't love hearing it, but you stayed open.",
          eqLesson: "Staying regulated under pressure is its own skill. You kept the door open for the next conversation.",
          skillsUsed: ['emotional-regulation', 'openness'],
        },
      },
      jordan_patient: {
        id: 'jordan_patient',
        npcMessage: "That's the issue — when there are too many 'key' metrics, there are zero. Pick one, make your case, done. Work on that edit.",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'improved',
          finalMessage: "You asked for input but struggled to apply it in the moment. You'll leave with the concept — now it just needs to click.",
          eqLesson: "Being coachable means more than accepting feedback — it means letting it change how you think. That takes practice.",
          skillsUsed: ['openness', 'growth-mindset'],
        },
      },
      jordan_done: {
        id: 'jordan_done',
        npcMessage: "[Jordan ends the meeting. You receive notes via email. There's a new tension between you.]",
        npcEmotion: 'angry',
        isEnding: true,
        endingData: {
          relationshipImpact: 'damaged',
          finalMessage: "You defended yourself when the situation called for listening. The feedback didn't land and neither did you.",
          eqLesson: "When someone has power over your growth, fighting the feedback is rarely worth the relationship cost. Receiving well is a skill — practice it.",
          skillsUsed: [],
        },
      },
      silent_end: {
        id: 'silent_end',
        npcMessage: "[Jordan moves on. You leave the meeting feeling unsettled. The feedback is still in the air, unprocessed.]",
        npcEmotion: 'neutral',
        isEnding: true,
        endingData: {
          relationshipImpact: 'neutral',
          finalMessage: "You survived the conversation but didn't grow from it. The feedback is still unresolved in you.",
          eqLesson: "Shutting down in hard moments is a protection response — but it costs you growth. Even 'I need a moment to process that' keeps the door open.",
          skillsUsed: [],
        },
      },
    },
  },

  // ─── SCENARIO 3: YOUR PARTNER FEELS UNHEARD (Hard) ─────────────
  {
    id: 'scenario_partner',
    title: 'Your Partner Feels Unheard',
    difficulty: 'hard',
    icon: '💕',
    situation: 'Your partner brings up that they\'ve been feeling disconnected from you lately.',
    context: 'You\'ve been under a lot of stress. You feel like you\'re already giving everything you have. But they\'re hurting and need to feel seen.',
    npcName: 'Sam',
    npcAvatar: '💕',
    initialRelationship: 60,
    userGoal: 'Make your partner feel truly heard — without defending yourself or fixing the problem',
    startNodeId: 'start',
    eqSkillsFocused: ['empathy', 'active-listening', 'vulnerability', 'emotional-honesty', 'emotional-regulation'],
    nodes: {
      start: {
        id: 'start',
        npcMessage: "Hey... can we talk? I've been feeling a little disconnected from you lately, and I want to say something.",
        npcEmotion: 'worried',
        choices: [
          { id: 'c1a', text: "Yeah, of course. Tell me what's going on.", nextNodeId: 'sam_opens', relationshipDelta: 5, eqScore: 9 },
          { id: 'c1b', text: "Can it wait? I just got home and I'm exhausted.", nextNodeId: 'sam_hurt', relationshipDelta: -10, eqScore: 2 },
          { id: 'c1c', text: "Disconnected? I've been right here. What do you mean?", nextNodeId: 'sam_explains', relationshipDelta: 0, eqScore: 5 },
        ],
      },
      sam_opens: {
        id: 'sam_opens',
        npcMessage: "It's like... even when we're together, you're kind of somewhere else. Last week I was telling you about the job stuff and I could tell you weren't really there. I don't know if I'm imagining it.",
        npcEmotion: 'sad',
        choices: [
          { id: 'c2a', text: "You're not imagining it. I have been distracted. I'm sorry — I've had a lot going on and it's spilling over. That's not fair to you.", nextNodeId: 'sam_relieved', relationshipDelta: 12, eqScore: 10 },
          { id: 'c2b', text: "Last week I was dealing with the project deadline. I was genuinely stressed.", nextNodeId: 'sam_needs_more', relationshipDelta: -2, eqScore: 5 },
          { id: 'c2c', text: "I remember that conversation. I was listening.", nextNodeId: 'sam_doubt', relationshipDelta: -8, eqScore: 2 },
        ],
      },
      sam_explains: {
        id: 'sam_explains',
        npcMessage: "Like... I'll be talking and you'll just kind of nod but I can tell you're not really taking it in. Or you'll check your phone. It makes me feel like I'm not a priority.",
        npcEmotion: 'sad',
        choices: [
          { id: 'c2d', text: "That sounds really lonely. I hear you, and I'm sorry.", nextNodeId: 'sam_relieved', relationshipDelta: 10, eqScore: 10 },
          { id: 'c2e', text: "I check my phone sometimes, but that doesn't mean I'm not listening.", nextNodeId: 'sam_doubt', relationshipDelta: -8, eqScore: 3 },
          { id: 'c2f', text: "I've just been really stressed. It's not about you.", nextNodeId: 'sam_needs_more', relationshipDelta: 0, eqScore: 5 },
        ],
      },
      sam_hurt: {
        id: 'sam_hurt',
        npcMessage: "That's kind of what I mean. [Pause] ...Okay. We can talk tomorrow.",
        npcEmotion: 'hurt',
        choices: [
          { id: 'c2g', text: "Wait — no. I'm sorry. Sit down. Tell me what's going on.", nextNodeId: 'sam_softens', relationshipDelta: 5, eqScore: 8 },
          { id: 'c2h', text: "[You let them walk away]", nextNodeId: 'withdraw_end', relationshipDelta: -15, eqScore: 1 },
        ],
      },
      sam_relieved: {
        id: 'sam_relieved',
        npcMessage: "Thank you for saying that. I know you've been under a lot of pressure. I just need to feel like we're still a team, you know?",
        npcEmotion: 'hopeful',
        choices: [
          { id: 'c3a', text: "We are. And you deserve more of my presence. Can we figure out something small — like phones away during dinner?", nextNodeId: 'sam_connected', relationshipDelta: 10, eqScore: 10 },
          { id: 'c3b', text: "I know. I'll try to do better.", nextNodeId: 'sam_hopeful', relationshipDelta: 5, eqScore: 7 },
          { id: 'c3c', text: "I want to be. I've just been barely keeping my head above water.", nextNodeId: 'sam_needs_space', relationshipDelta: 2, eqScore: 6 },
        ],
      },
      sam_needs_more: {
        id: 'sam_needs_more',
        npcMessage: "I get that you're stressed. I just wish I felt like part of how you cope — not something you're too tired to deal with.",
        npcEmotion: 'sad',
        choices: [
          { id: 'c3d', text: "That's a fair thing to say. I've been carrying a lot and I think I've been shutting people out without realizing it.", nextNodeId: 'sam_relieved', relationshipDelta: 10, eqScore: 9 },
          { id: 'c3e', text: "I don't know how to explain it. It's just been a lot.", nextNodeId: 'sam_patient', relationshipDelta: 2, eqScore: 5 },
          { id: 'c3f', text: "I can't win here. If I'm stressed that's a problem — if I try to deal with it, I'm distant.", nextNodeId: 'sam_escalate', relationshipDelta: -15, eqScore: 1 },
        ],
      },
      sam_doubt: {
        id: 'sam_doubt',
        npcMessage: "You asked me what I wanted to order twice that night. I had already told you I was thinking about moving teams. You had no idea what I was talking about.",
        npcEmotion: 'hurt',
        choices: [
          { id: 'c3g', text: "You're right. I don't remember that, and I should. I'm sorry — I wasn't present.", nextNodeId: 'sam_relieved', relationshipDelta: 8, eqScore: 9 },
          { id: 'c3h', text: "I was distracted, but that happens to everyone sometimes.", nextNodeId: 'sam_escalate', relationshipDelta: -12, eqScore: 2 },
        ],
      },
      sam_softens: {
        id: 'sam_softens',
        npcMessage: "[Sits back down] I just feel like lately I've been invisible. Like my stuff doesn't matter compared to everything on your plate.",
        npcEmotion: 'sad',
        choices: [
          { id: 'c3i', text: "Your stuff matters. I've been failing at showing that, and I'm sorry. What would help you feel more seen?", nextNodeId: 'sam_connected', relationshipDelta: 12, eqScore: 10 },
          { id: 'c3j', text: "You're not invisible. I've just had a hard week.", nextNodeId: 'sam_needs_more', relationshipDelta: 3, eqScore: 6 },
        ],
      },
      sam_connected: {
        id: 'sam_connected',
        npcMessage: "Yes — that would mean everything. And honestly, just... this. Talking like this. I already feel better.",
        npcEmotion: 'happy',
        isEnding: true,
        endingData: {
          relationshipImpact: 'strengthened',
          finalMessage: "You showed up fully — even when you were tired and stressed. Sam felt heard, not managed.",
          eqLesson: "Presence is more powerful than solutions. When someone feels invisible, the most healing thing you can offer is to fully see them — without fixing or defending. You did that.",
          skillsUsed: ['empathy', 'active-listening', 'vulnerability', 'emotional-honesty'],
        },
      },
      sam_hopeful: {
        id: 'sam_hopeful',
        npcMessage: "I know you're trying. I just needed to say it out loud, I think. Thank you for listening.",
        npcEmotion: 'hopeful',
        isEnding: true,
        endingData: {
          relationshipImpact: 'improved',
          finalMessage: "You stayed open and Sam felt heard. The promise to do better lands better because they felt acknowledged first.",
          eqLesson: "Acknowledgment before action. When someone brings hurt to you, they usually need to feel heard before they need a plan. You gave them that.",
          skillsUsed: ['empathy', 'active-listening'],
        },
      },
      sam_patient: {
        id: 'sam_patient',
        npcMessage: "[Sighs] Okay. I love you. I just miss you. Can we try to have some real time together this week?",
        npcEmotion: 'hopeful',
        choices: [
          { id: 'c4a', text: "Yes. Absolutely. I'll clear Saturday — just us.", nextNodeId: 'sam_hopeful', relationshipDelta: 8, eqScore: 8 },
          { id: 'c4b', text: "I'll try. I can't promise things will clear up soon.", nextNodeId: 'sam_resign', relationshipDelta: -2, eqScore: 4 },
        ],
      },
      sam_needs_space: {
        id: 'sam_needs_space',
        npcMessage: "Tell me what's going on with you. I want to know.",
        npcEmotion: 'hopeful',
        choices: [
          { id: 'c4c', text: "[You open up — the work pressure, the anxiety, how you haven't slept well in weeks]", nextNodeId: 'sam_connected', relationshipDelta: 12, eqScore: 10 },
          { id: 'c4d', text: "It's just a lot of stuff. Work. I'd rather not get into it.", nextNodeId: 'sam_patient', relationshipDelta: -3, eqScore: 4 },
        ],
      },
      sam_escalate: {
        id: 'sam_escalate',
        npcMessage: "I'm not attacking you. I'm telling you I miss you. [Their voice breaks a little.] That's it.",
        npcEmotion: 'hurt',
        choices: [
          { id: 'c4e', text: "I know. I'm sorry — I got defensive and I shouldn't have. You didn't deserve that.", nextNodeId: 'sam_hopeful', relationshipDelta: 8, eqScore: 9 },
          { id: 'c4f', text: "[You go quiet. The conversation ends without resolution.]", nextNodeId: 'unresolved_end', relationshipDelta: -10, eqScore: 1 },
        ],
      },
      withdraw_end: {
        id: 'withdraw_end',
        npcMessage: "[Sam goes to the other room. There's a heavy silence in the house that night.]",
        npcEmotion: 'hurt',
        isEnding: true,
        endingData: {
          relationshipImpact: 'damaged',
          finalMessage: "You let the moment pass — and so did the connection. Distance grows when left unaddressed.",
          eqLesson: "When someone we love reaches for us and we turn away — even once — it registers. Catching yourself and turning back changes everything.",
          skillsUsed: [],
        },
      },
      unresolved_end: {
        id: 'unresolved_end',
        npcMessage: "[You go to separate rooms. It's a heavy night. Nothing was resolved.]",
        npcEmotion: 'sad',
        isEnding: true,
        endingData: {
          relationshipImpact: 'damaged',
          finalMessage: "Defensiveness shut down a conversation that needed to happen. The hurt is still there, unaddressed.",
          eqLesson: "Defensiveness protects you — but in intimate relationships, it often hurts the other person more than whatever triggered it. The repair usually takes longer than the conversation would have.",
          skillsUsed: [],
        },
      },
      sam_resign: {
        id: 'sam_resign',
        npcMessage: "[Sam nods. Looks a little deflated.] Okay.",
        npcEmotion: 'sad',
        isEnding: true,
        endingData: {
          relationshipImpact: 'neutral',
          finalMessage: "You heard them but hedged your response. The connection was partially repaired, but the uncertainty lingers.",
          eqLesson: "Sometimes 'I'll try' is honest — and that's okay. But in close relationships, specificity signals care. 'Saturday, just us' does more than 'I'll see what I can do.'",
          skillsUsed: ['empathy'],
        },
      },
    },
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return CONVERSATION_MASTER_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Scenario[] {
  return CONVERSATION_MASTER_SCENARIOS.filter(s => s.difficulty === difficulty);
}
