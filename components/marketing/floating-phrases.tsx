const phrases = [
  { text: "Ciao bella!", x: "10%", y: "20%" },
  { text: "¡Hola mundo!", x: "80%", y: "15%" },
  { text: "Bonjour!", x: "20%", y: "60%" },
  { text: "Guten Tag!", x: "70%", y: "70%" },
  { text: "你好!", x: "85%", y: "40%" },
  { text: "こんにちは!", x: "15%", y: "85%" },
  { text: "안녕하세요!", x: "90%", y: "80%" },
  { text: "Olá!", x: "5%", y: "40%" }
];

export function FloatingPhrases() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {phrases.map((phrase, i) => (
        <div
          key={i}
          className="floating-phrase text-2xl md:text-3xl"
          style={{
            left: phrase.x,
            top: phrase.y
          }}
        >
          {phrase.text}
        </div>
      ))}
    </div>
  );
}