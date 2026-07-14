import {KeyboardEvent} from 'react';
import {PackagePlusIcon} from "lucide-react";
import {useTranslation} from "react-i18next";

interface Props {
    onClick: () => void;
}

const AddGroupButton = ({onClick}: Props) => {

    const {t} = useTranslation();

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        event.preventDefault();
        onClick();
    };

    return (
        <div
            className={'inline-flex h-6 cursor-pointer select-none items-center gap-1 rounded bg-blue-500 px-2 text-xs leading-none text-white transition-colors hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'}
            role={'button'}
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            <PackagePlusIcon className={'h-3 w-3'}/>
            {t('assets.new_group')}
        </div>
    );
};

export default AddGroupButton;
