import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import { Badge } from "@te-inscreve/components";

interface Props {
    isGroup: boolean;
}
export function IsGroupBadge({ isGroup }: Props) {
    return (
        <Badge variant="primary-outline">
            {isGroup ? (
                <>
                    <UsersThreeIcon weight="bold" />
                    Em grupo
                </>
            ) : (
                <>
                    <UserIcon weight="bold" />
                    Individual
                </>
            )}
        </Badge>
    );
}
