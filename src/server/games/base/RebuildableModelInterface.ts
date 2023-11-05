export default interface RebuildableModelInterface<T> {
  rebuildImplementation: (data: T) => void;
}
