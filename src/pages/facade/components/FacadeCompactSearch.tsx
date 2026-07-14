import {Search, X} from 'lucide-react';
import {useTranslation} from 'react-i18next';

interface FacadeCompactSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const FacadeCompactSearch = ({value, onChange, placeholder}: FacadeCompactSearchProps) => {
    const {t} = useTranslation();

    return (
        <div className={'flex h-8 w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 transition-colors focus-within:border-[#1A73E8] focus-within:ring-2 focus-within:ring-[#1A73E8]/10 dark:border-slate-700 dark:bg-[#141414]'}>
            <Search className={'h-3.5 w-3.5 flex-none text-slate-400 dark:text-slate-500'} />
            <input
                type="text"
                value={value}
                placeholder={placeholder || t('general.search_placeholder')}
                className={'min-w-0 flex-1 bg-transparent text-sm leading-5 text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500'}
                onChange={(event) => onChange(event.target.value)}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className={'flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'}
                    aria-label={t('facade.clear_search')}
                >
                    <X className={'h-3 w-3'} />
                </button>
            )}
        </div>
    );
};

export default FacadeCompactSearch;
