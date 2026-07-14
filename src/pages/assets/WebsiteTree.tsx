import {useMutation, useQuery} from '@tanstack/react-query';
import websiteApi from '@/api/website-api';
import GroupTree from '@/pages/assets/GroupTree';

interface Props {
    selected: string;
    onSelect: (key: string) => void;
}

const WebsiteTree = ({selected, onSelect}: Props) => {
    const query = useQuery({
        queryKey: ['websites/tree'],
        queryFn: websiteApi.getGroups,
    });
    const saveMutation = useMutation({mutationFn: websiteApi.setGroups});
    const deleteMutation = useMutation({
        mutationFn: websiteApi.deleteGroup,
        onSuccess: () => query.refetch(),
    });

    return (
        <GroupTree
            data={query.data}
            selected={selected}
            keyPrefix="WG_"
            saving={saveMutation.isPending}
            onSelect={onSelect}
            onSave={data => saveMutation.mutateAsync(data)}
            onDelete={key => deleteMutation.mutateAsync(key)}
        />
    );
};

export default WebsiteTree;
