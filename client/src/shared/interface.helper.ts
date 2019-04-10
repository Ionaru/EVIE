export interface IServerResponse<T> {
    state: string;
    message: string;
    data?: T;
}

export interface IUsersResponse {
    email: string;
    id: number;
    isAdmin: boolean;
    lastLogin: Date;
    timesLogin: number;
    username: string;
    uuid: string;
    characters: IUsersResponseCharacters[];
}

export interface IMarketOrdersReponse {
    order_id: number;
    type_id: number;
    location_id: number;
    volume_total: number;
    volume_remain: number;
    min_volume: number;
    price: number;
    is_buy_order: boolean;
    duration: number;
    issued: string;
    range: string;
}

export interface IUsersResponseCharacters {
    accessToken: string;
    characterId: number;
    id: number;
    isActive: boolean;
    name: string;
    ownerHash: string;
    refreshToken: string;
    scopes: string;
    tokenExpiry: Date;
    uuid: string;
}

export interface ITypesData {
    capacity: number;
    description: string;
    dogma_attributes: IDogmaAttributes[];
    dogma_effects: IDogmaEffects[];
    graphic_id: number;
    group_id: number;
    icon_id: number;
    market_group_id: number;
    mass: number;
    name: string;
    packaged_volume: number;
    portion_size: number;
    published: boolean;
    radius: number;
    type_id: number;
    volume: number;
}

export interface IDogmaAttributes {
    attribute_id: number;
    value: number;
}

export interface IDogmaEffects {
    effect_id: number;
    is_default: boolean;
}

export interface IESINamesData {
    category: string;
    id: number;
    name: string;
}

export interface INames {
    [id: string]: IESINamesData;
}

export interface IShipData {
    ship_item_id: number;
    ship_name: string;
    ship_type_id: number;
}

export interface ISkillCategoryData {
    category_id: number;
    name: string;
    published: boolean;
    groups: number[];
}

export interface ISkillGroupData {
    group_id: number;
    name: string;
    published: boolean;
    category_id: number;
    types: number[];
}

export interface ISkillData {
    active_skill_level: number;
    skill_id: number;
    skillpoints_in_skill: number;
    trained_skill_level: number;
}

export interface ISkillsData {
    skills: ISkillData[];
    total_sp: number;
    unallocated_sp?: number;
}

export interface ISkillQueueData {
    finish_date?: string;

    finished_level: number;

    level_end_sp?: number;

    // Amount of SP that was in the skill when it started training it’s current level. Used to calculate % of current level complete.
    level_start_sp?: number;

    queue_position: number;

    skill_id: number;

    start_date?: string;

    training_start_sp?: number;
}

export interface IStatusData {
    start_time: string;
    players: number;
    server_version: string;
}

export interface IAttributesData {
    // Neural remapping cooldown after a character uses remap accrued over time
    accrued_remap_cooldown_date?: Date;

    // Number of available bonus character neural remaps
    bonus_remaps?: number;

    // Datetime of last neural remap, including usage of bonus remaps
    last_remap_date?: Date;

    charisma: number;
    intelligence: number;
    memory: number;
    perception: number;
    willpower: number;
}

export interface IWalletJournalData {
    // The amount of ISK given or taken from the wallet as a result of the given transaction. Positive when ISK is deposited into the wallet
    // and negative when ISK is withdrawn
    amount?: number;

    // Wallet balance after transaction occurred
    balance?: number;

    // An ID that gives extra context to the particular transaction. Because of legacy reasons the context is completely different per
    // ref_type and means different things. It is also possible to not have a context_id
    context_id?: number;

    // The type of the given context_id if present
    context_id_type?: string;

    // Date and time of transaction
    date: string;

    // The reason for the transaction, mirrors what is seen in the client
    description: string;

    // The id of the first party involved in the transaction. This attribute has no consistency and is different or non existent for
    // particular ref_types. The description attribute will help make sense of what this attribute means. For more info about the given ID
    // it can be dropped into the /universe/names/ ESI route to determine its type and name
    first_party_id?: number;

    // The id of the second party involved in the transaction. This attribute has no consistency and is different or non existent for
    // particular ref_types. The description attribute will help make sense of what this attribute means. For more info about the given ID
    // it can be dropped into the /universe/names/ ESI route to determine its type and name
    second_party_id?: number;

    // Unique journal reference ID
    id: number;

    // The user stated reason for the transaction. Only applies to some ref_types
    reason?: string;

    // The transaction type for the given transaction. Different transaction types will populate different attributes. Note: If you have an
    // existing XML API application that is using ref_types, you will need to know which string ESI ref_type maps to which integer. You can
    // look at the following file to see string->int mappings:
    // https://github.com/ccpgames/eve-glue/blob/master/eve_glue/wallet_journal_ref.py
    ref_type: string;

    // Tax amount received. Only applies to tax related transactions
    tax?: number;

    // The corporation ID receiving any tax paid. Only applies to tax related transactions
    tax_receiver_id?: number;
}

export interface IIndustryJobsData {
    // Job activity ID
    activityId: number;

    // blueprint_id integer
    blueprintId: number;

    // Location ID of the location from which the blueprint was installed. Normally a station ID, but can also be an asset (e.g. container)
    // or corporation facility
    blueprintLocationId: number;

    // blueprint_type_id integer
    blueprintTypeId: number;

    // ID of the character which completed this job
    completedCharacterId: number;

    // Date and time when this job was completed
    completedDate: Date;

    // The sume of job installation fee and industry facility tax
    cost: number;

    // Job duration in seconds
    duration: number;

    // Date and time when this job finished
    endDate: Date;

    // ID of the facility where this job is running
    facilityId: number;

    // ID of the character which installed this job
    installerId: number;

    // Unique job ID
    jobId: number;

    // Number of runs blueprint is licensed for
    licensedRuns: number;

    // Location ID of the location to which the output of the job will be delivered. Normally a station ID, but can also be a
    // corporation facility.
    outputLocationId: number;

    // Date and time when this job was paused (i.e. time when the facility where this job was installed went offline)
    pauseDate: Date;

    // Chance of success for invention
    probability: number;

    // Type ID of product (manufactured, copied or invented)
    productTypeId: number;

    // Number of runs for a manufacturing job, or number of copies to make for a blueprint copy
    runs: number;

    // Date and time when this job started
    startDate: Date;

    // ID of the station where industry facility is located
    stationId: number;

    // Status string
    status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';

    // Number of successful runs for this job. Equal to runs unless this is an invention job
    successfulRuns: number;
}

export interface IIndustryActivityProducts {
    typeID: number;
    activityID: number;
    productTypeID: number;
    quantity: number;
}

export interface IIndustryActivitySkills {
    typeID: number;
    activityID: number;
    skillID: number;
    level: number;
}

export interface IIndustryActivityMaterials {
    typeID: number;
    activityID: number;
    materialTypeID: number;
    quantity: number;
}

export interface IIndustryActivity {
    typeID: number;
    activityID: number;
    time: number;
}

export enum IndustryActivity {
    none = 0,
    manufacturing = 1,
    research_time_efficiency = 3,
    research_material_efficiency = 4,
    copying = 6,
    reverse_engineering = 7,
    invention = 8,
    reactions = 11,
}

export interface IMarketGroup {
    description: string;
    market_group_id: number;
    name: string;
    parent_group_id: number;
    types: number[];
}

export interface IManufacturingData {
    blueprintId: number;
    materials: Array<{
        id: number,
        quantity: number,
    }>;
    skills: Array<{
        id: number,
        level: number,
    }>;
    time: number;
    result: {
        id: number,
        quantity: number,
    };
}
