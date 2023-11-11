export default interface RebuildableModelInterface<T> {
  rebuild: (data: T) => void;
}
