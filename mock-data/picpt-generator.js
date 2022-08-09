const blankPt = {
  apiVersion: 'harvesterhci.io.github.com/v1beta1',
  kind:       'PCIPassthroughRequest',
  metadata:   { },
  status:     { }
};

export const mockBlankPt = () => {
  return { ...blankPt };
};
