import React from 'react';
import { Marker } from 'react-native-maps';
import { Task } from '../../types/task';
import { colors } from '../../config/theme';

type TaskMarkerProps = {
  task: Task;
  onPress: (task: Task) => void;
};

export const TaskMarker = React.memo(({ task, onPress }: TaskMarkerProps) => {
  return (
    <Marker
      identifier={task.id}
      coordinate={{
        latitude: task.location.latitude,
        longitude: task.location.longitude,
      }}
      title={task.title}
      description={task.category}
      pinColor={
        task.status === 'OPEN' ? colors.primary : 
        task.status === 'IN_PROGRESS' ? colors.warning : colors.textTertiary
      }
      onPress={() => onPress(task)}
      tracksViewChanges={false}
    />
  );
}); 