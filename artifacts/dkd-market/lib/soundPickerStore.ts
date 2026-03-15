export type SoundItem = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  uri: string;
};

type Listener = (sound: SoundItem) => void;

let _listeners: Listener[] = [];

export const soundPickerStore = {
  setSelected(sound: SoundItem) {
    _listeners.forEach((fn) => fn(sound));
  },
  onSelected(fn: Listener): () => void {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  },
};
