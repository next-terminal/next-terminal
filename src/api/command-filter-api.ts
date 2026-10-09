import {Api} from "@/api/core/api";

export interface CommandFilter {
    id: string;
    name: string;
    createdAt: number;
}

class CommandFilterApi extends Api<CommandFilter>{

    constructor() {
        super("admin/command-filters");
    }
}

const commandFilterApi = new CommandFilterApi();
export default commandFilterApi;