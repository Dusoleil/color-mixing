import {vec3} from "glMatrix"

export var validity_check =
{
    computed:
    {
        target()
        {
            return this.$store.state.target_color;
        },
        current()
        {
            return this.$store.state.current_color;
        },
        comp_colors()
        {
            return this.$store.state.comp_colors;
        }
    },
    methods:
    {
        point_to_point_distance(c1,c2)
        {
            return vec3.distance(c1.XYZ,c2.XYZ)
        },
        project_onto_line(c,l1,l2)
        {
            let a = vec3.create();
            vec3.subtract(a,c.XYZ,l1.XYZ);
            let b = vec3.create();
            vec3.subtract(b,l2.XYZ,l1.XYZ);
            vec3.normalize(b,b);
            let scalar_proj = vec3.dot(a,b);
            let proj = vec3.create();
            vec3.scale(proj,b,scalar_proj);
            vec3.add(proj,proj,l1.XYZ);
            return proj;
        },
        point_to_line_distance(c,l1,l2)
        {
            let projection = {XYZ:this.project_onto_line(c,l1,l2)};
            return this.point_to_point_distance(c,projection);
        },
        angle_between_lines(a1,a2,b1,b2)
        {
            let a = vec3.create();
            vec3.subtract(a,a2.XYZ,a1.XYZ);
            let b = vec3.create();
            vec3.subtract(b,b2.XYZ,b1.XYZ);
            let t = vec3.angle(a,b);
            if(t>(Math.PI/2))
                t = Math.PI - t;
            return t;
        },
        rad_to_deg(t)
        {
            return t * (180/Math.PI);
        }
    },
    template:/*html*/`
        <v-card title="Check Validity" elevation="10" class="mx-auto mt-10" :style="{'max-width':'75dvw'}"><v-card-text>
            <template v-if="comp_colors.length < 1">
                <v-label>No Component Colors to Work With</v-label>
            </template>
            <template v-if="comp_colors.length == 1">
                <v-label>Only One Component Color</v-label>
                <v-divider color="primary"></v-divider>
                {{target.name}} is {{point_to_point_distance(target,comp_colors[0]).toFixed(4)}} away from {{comp_colors[0].name}}
                <v-divider class="border-opacity-0"></v-divider>
                {{current.name}} is {{point_to_point_distance(current,comp_colors[0]).toFixed(4)}} away from {{comp_colors[0].name}}
            </template>
            <template v-if="comp_colors.length == 2">
                <v-label>There are Two Component Colors</v-label>
                <v-divider color="primary"></v-divider>
                All colors made by mixing {{comp_colors[0].name}} and {{comp_colors[1].name}} should exist on the line between them.
                <v-divider class="border-opacity-0"></v-divider>
                {{target.name}} is {{point_to_line_distance(target,comp_colors[0],comp_colors[1]).toFixed(4)}} away from the line.
                <v-divider class="border-opacity-0"></v-divider>
                {{current.name}} is {{point_to_line_distance(current,comp_colors[0],comp_colors[1]).toFixed(4)}} away from the line.
                <v-divider class="border-opacity-0"></v-divider>
                The line from {{target.name}} to {{current.name}} should be parallel to the line from {{comp_colors[0].name}} to {{comp_colors[1].name}}.
                <v-divider class="border-opacity-0"></v-divider>
                The angle between these lines is {{angle_between_lines(target,current,comp_colors[0],comp_colors[1]).toFixed(4)}} ({{rad_to_deg(angle_between_lines(target,current,comp_colors[0],comp_colors[1])).toFixed(4)}}&deg;).
            </template>
            <template v-if="comp_colors.length > 2">
                <v-label>More Than 2 Component Colors Not Yet Implemented</v-label>
                <v-divider class="border-opacity-0"></v-divider>
                <v-label>For Now, Here's the First Two Components</v-label>
                <v-divider color="primary"></v-divider>
                For the line between {{comp_colors[0].name}} and {{comp_colors[1].name}}...
                <v-divider class="border-opacity-0"></v-divider>
                {{target.name}} is {{point_to_line_distance(target,comp_colors[0],comp_colors[1]).toFixed(4)}} away from the line.
                <v-divider class="border-opacity-0"></v-divider>
                {{current.name}} is {{point_to_line_distance(current,comp_colors[0],comp_colors[1]).toFixed(4)}} away from the line.
                <v-divider class="border-opacity-0"></v-divider>
                The line from {{target.name}} to {{current.name}} should be parallel to the line from {{comp_colors[0].name}} to {{comp_colors[1].name}}.
                <v-divider class="border-opacity-0"></v-divider>
                The angle between these lines is {{angle_between_lines(target,current,comp_colors[0],comp_colors[1]).toFixed(4)}} ({{rad_to_deg(angle_between_lines(target,current,comp_colors[0],comp_colors[1])).toFixed(4)}}&deg;).
            </template>
        </v-card-text></v-card>`
};
