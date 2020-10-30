import { EVE, Ore } from '@ionaru/eve-utils';

export const getAffectingSkillId = (oreId: number) => {
    switch (oreId) {

        case Ore.Veldspar:
        case Ore['Concentrated Veldspar']:
        case Ore['Dense Veldspar']:
        case Ore['Stable Veldspar']:
        case 28430:
        case 28431:
        case 28432:
        case 46705:
            return 12195;

        case Ore.Scordite:
        case Ore['Condensed Scordite']:
        case Ore['Massive Scordite']:
        case Ore['Glossy Scordite']:
        case 28427:
        case 46703:
        case 28428:
        case 28429:
            return 12193;

        case Ore.Pyroxeres:
        case Ore['Solid Pyroxeres']:
        case Ore['Viscous Pyroxeres']:
        case Ore['Opulent Pyroxeres']:
        case 46702:
        case 28424:
        case 28425:
        case 28426:
            return 12192;

        case Ore.Plagioclase:
        case Ore['Azure Plagioclase']:
        case Ore['Rich Plagioclase']:
        case Ore['Sparkling Plagioclase']:
        case 28421:
        case 28422:
        case 28423:
        case 46701:
            return 12191;

        case Ore.Omber:
        case Ore['Silvery Omber']:
        case Ore['Golden Omber']:
        case Ore['Platinoid Omber']:
        case 28415:
        case 28416:
        case 46700:
        case 28417:
            return 12190;

        case Ore.Kernite:
        case Ore['Luminous Kernite']:
        case Ore['Fiery Kernite']:
        case Ore['Resplendant Kernite']:
        case 28409:
        case 28410:
        case 28411:
        case 46699:
            return 12188;

        case Ore.Jaspet:
        case Ore['Pure Jaspet']:
        case Ore['Pristine Jaspet']:
        case Ore['Immaculate Jaspet']:
        case 46698:
        case 28406:
        case 28407:
        case 28408:
            return 12187;

        case Ore.Hemorphite:
        case Ore['Vivid Hemorphite']:
        case Ore['Radiant Hemorphite']:
        case Ore['Scintillating Hemorphite']:
        case 28403:
        case 28404:
        case 46697:
        case 28405:
            return 12186;

        case Ore.Hedbergite:
        case Ore['Vitric Hedbergite']:
        case Ore['Glazed Hedbergite']:
        case Ore['Lustrous Hedbergite']:
        case 28400:
        case 28401:
        case 46696:
        case 28402:
            return 12185;

        case Ore.Gneiss:
        case Ore['Iridescent Gneiss']:
        case Ore['Prismatic Gneiss']:
        case Ore['Brilliant Gneiss']:
        case 46695:
        case 28397:
        case 28398:
        case 28399:
            return 12184;

        case Ore['Dark Ochre']:
        case Ore['Onyx Ochre']:
        case Ore['Obsidian Ochre']:
        case Ore['Jet Ochre']:
        case 28394:
        case 46694:
        case 28395:
        case 28396:
            return 12183;

        case Ore.Spodumain:
        case Ore['Bright Spodumain']:
        case Ore['Gleaming Spodumain']:
        case Ore['Dazzling Spodumain']:
        case 28418:
        case 46704:
        case 28419:
        case 28420:
            return 12194;

        case Ore.Crokite:
        case Ore['Sharp Crokite']:
        case Ore['Crystalline Crokite']:
        case Ore['Pellucid Crokite']:
        case 28391:
        case 28392:
        case 46693:
        case 28393:
            return 12182;

        case Ore.Bistot:
        case Ore['Triclinic Bistot']:
        case Ore['Monoclinic Bistot']:
        case Ore['Cubic Bistot']:
        case 28388:
        case 46692:
        case 28389:
        case 28390:
            return 12181;

        case Ore.Arkonor:
        case Ore['Crimson Arkonor']:
        case Ore['Prime Arkonor']:
        case Ore['Flawless Arkonor']:
        case 28367:
        case 28385:
        case 28387:
        case 46691:
            return 12180;

        case Ore.Mercoxit:
        case Ore['Magma Mercoxit']:
        case Ore['Vitreous Mercoxit']:
        case 28412:
        case 28413:
        case 28414:
            return 12189;
    }

    if (EVE.ores.moon.ubiquitous.includes(oreId)) {
        return 46152;
    }

    if (EVE.ores.moon.common.includes(oreId)) {
        return 46153;
    }

    if (EVE.ores.moon.uncommon.includes(oreId)) {
        return 46154;
    }

    if (EVE.ores.moon.rare.includes(oreId)) {
        return 46155;
    }

    if (EVE.ores.moon.exceptional.includes(oreId)) {
        return 46156;
    }

    if (oreId === Ore.Rakovene) {
        return 56633;
    }

    if (oreId === Ore.Bezdnacine) {
        return 56631;
    }

    if (oreId === Ore.Talassonite) {
        return 56632;
    }

    if ([...EVE.ice.enriched, ...EVE.ice.standard, ...EVE.ice.faction].includes(oreId)) {
        return 18025;
    }

    return 12196;
};
