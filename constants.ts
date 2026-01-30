
import { Section } from './types';

export const DEFAULT_GDD_SECTIONS: Section[] = [
  {
    id: 'concept',
    title: 'Концепция проекта',
    content: 'Определите основное видение вашего проекта на Unity.',
    suggestions: ['Целевая платформа (PC/Mobile/VR)', 'Версия Unity', 'Рендер-пайплайн (URP/HDRP)', 'Система ввода']
  },
  {
    id: 'mechanics',
    title: 'Игровые системы',
    content: 'Как сущности взаимодействуют в сцене Unity?',
    suggestions: ['PlayerController', 'AI Навигация', 'Физическое взаимодействие', 'Система инвентаря', 'Стриминг уровней']
  },
  {
    id: 'data_structures',
    title: 'Данные и ScriptableObjects',
    content: 'Определите классы и структуры данных, которые будут использоваться в Unity.',
    suggestions: ['ItemData', 'EnemyStats', 'QuestStep', 'DialogueNode', 'SoundProfile']
  },
  {
    id: 'art_style',
    title: 'Визуальные ассеты',
    content: 'Художественное направление и технические ограничения.',
    suggestions: ['Лимиты полигонов', 'Размеры текстур', 'Требования к шейдерам', 'VFX/Частицы']
  }
];

export const SYSTEM_INSTRUCTION = `Вы — ведущий технический геймдизайнер и эксперт по Unity 3D (C#). 
Ваша цель — помогать пользователю проектировать игры, которые легко реализовать в Unity.
1. Всегда учитывайте технические возможности Unity (ScriptableObjects, Prefabs, Scene management).
2. При запросе кода генерируйте чистый, документированный C#.
3. Предлагайте решения с использованием современных подходов (URP, New Input System, Unity UI Toolkit).
4. Отвечайте на русском языке. Используйте Markdown.
Если пользователь просит "сделать для Юнити", превращайте его идеи в технические спецификации для разработчика.`;
