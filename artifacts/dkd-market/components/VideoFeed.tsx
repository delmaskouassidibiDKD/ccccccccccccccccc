import React, { useRef, useCallback } from "react";
import { FlatList, useWindowDimensions, ViewToken } from "react-native";

interface NativeVideoFeedProps {
  children: React.ReactNode[];
  onPageChange: (i: number) => void;
}

export default function VideoFeed({ children, onPageChange }: NativeVideoFeedProps) {
  const { height } = useWindowDimensions();
  const items = React.Children.toArray(children);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const renderItem = useCallback(({ item }: { item: React.ReactNode }) => (
    <>{item}</>
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  }), [height]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        onPageChangeRef.current(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(_, i) => String(i)}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      maxToRenderPerBatch={2}
      windowSize={5}
      initialNumToRender={1}
      removeClippedSubviews
      scrollEventThrottle={16}
    />
  );
}
