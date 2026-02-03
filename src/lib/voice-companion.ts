export const speak = (text: string) => {
  // Check if browser supports speech
  if ('speechSynthesis' in window) {
    // Cancel any current speech so they don't overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1; 
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  }
};